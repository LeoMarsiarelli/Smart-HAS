package com.smarthas.backend.oracle;

import com.smarthas.backend.oracle.OracleDtos.AlertResponse;
import com.smarthas.backend.oracle.OracleDtos.DeliveryReportLine;
import com.smarthas.backend.oracle.OracleDtos.DeliveryReportResponse;
import com.smarthas.backend.oracle.OracleDtos.RiskScoreResponse;
import com.smarthas.backend.oracle.OracleDtos.UserSummaryResponse;
import oracle.jdbc.OracleTypes;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Chama as functions e procedures PL/SQL da camada Oracle (Fase 6) via JDBC
 * puro (CallableStatement), com o detalhe de REF CURSOR exposto explicitamente
 * para deixar claro o que está acontecendo no banco.
 * <p>
 * Oracle entra nesta fase como uma base <b>replicada</b> e independente do
 * datasource operacional (H2/Postgres): os usuários/leituras já existentes em
 * {@code app_user}/{@code blood_pressure_reading} (seed de demonstração) são
 * complementados, a cada nova leitura real do app, por
 * {@link #replicateReadingAndEvaluateAlert}, que usa o <b>email</b> como
 * chave de correlação entre os dois sistemas (os IDs numéricos são gerados
 * independentemente em cada banco). É esse método, chamado por
 * {@code BloodPressureService} logo após salvar a leitura, que implementa o
 * fluxo pedido pela atividade: REST (POST /api/readings) -&gt; Java -&gt;
 * JDBC -&gt; Oracle (PRC_REGISTER_CRITICAL_ALERT).
 */
@Service
@ConditionalOnProperty(prefix = "smarthas.oracle", name = "enabled", havingValue = "true")
public class OracleIntelligenceService {

    private final JdbcTemplate oracleJdbcTemplate;

    public OracleIntelligenceService(@Qualifier("oracleJdbcTemplate") JdbcTemplate oracleJdbcTemplate) {
        this.oracleJdbcTemplate = oracleJdbcTemplate;
    }

    /** FN_CLASSIFY_BP + FN_CALC_RISK_SCORE — indicador de risco calculado no banco. */
    public RiskScoreResponse calcRiskScore(int systolic, int diastolic) {
        String classification = classify(systolic, diastolic);

        Integer score = oracleJdbcTemplate.execute((ConnectionCallback<Integer>) con -> {
            try (CallableStatement cs = con.prepareCall("{ ? = call fn_calc_risk_score(?, ?) }")) {
                cs.registerOutParameter(1, Types.NUMERIC);
                cs.setInt(2, systolic);
                cs.setInt(3, diastolic);
                cs.execute();
                return cs.getInt(1);
            }
        });

        return new RiskScoreResponse(systolic, diastolic, classification, score);
    }

    /** FN_GET_USER_SUMMARY — dados formatados do paciente, montados no banco. */
    public UserSummaryResponse getUserSummary(Long userId) {
        String summary = oracleJdbcTemplate.execute((ConnectionCallback<String>) con -> {
            try (CallableStatement cs = con.prepareCall("{ ? = call fn_get_user_summary(?) }")) {
                cs.registerOutParameter(1, Types.VARCHAR);
                cs.setLong(2, userId);
                cs.execute();
                return cs.getString(1);
            }
        });
        return new UserSummaryResponse(userId, summary);
    }

    /** PRC_REGISTER_CRITICAL_ALERT — avalia a leitura e registra alerta se crítica. */
    public AlertResponse registerCriticalAlert(Long readingId) {
        oracleJdbcTemplate.execute((ConnectionCallback<Void>) con -> {
            try (CallableStatement cs = con.prepareCall("{ call prc_register_critical_alert(?) }")) {
                cs.setLong(1, readingId);
                cs.execute();
                return null;
            }
        });
        return new AlertResponse(readingId, true, "Leitura avaliada pela PRC_REGISTER_CRITICAL_ALERT");
    }

    /** PRC_USER_DELIVERY_REPORT — OUT NUMBER, OUT NUMBER, OUT SYS_REFCURSOR. */
    public DeliveryReportResponse getUserDeliveryReport(Long userId) {
        return oracleJdbcTemplate.execute((ConnectionCallback<DeliveryReportResponse>) con -> {
            try (CallableStatement cs = con.prepareCall("{ call prc_user_delivery_report(?, ?, ?, ?) }")) {
                cs.setLong(1, userId);
                cs.registerOutParameter(2, Types.NUMERIC);
                cs.registerOutParameter(3, Types.NUMERIC);
                cs.registerOutParameter(4, OracleTypes.CURSOR);
                cs.execute();

                int totalCount = cs.getInt(2);
                int totalQty = cs.getInt(3);
                List<DeliveryReportLine> details = new ArrayList<>();

                try (ResultSet rs = (ResultSet) cs.getObject(4)) {
                    while (rs.next()) {
                        details.add(new DeliveryReportLine(
                                rs.getString("medication_name"),
                                rs.getInt("quantity"),
                                rs.getString("status"),
                                rs.getString("priority"),
                                rs.getTimestamp("requested_at").toLocalDateTime()
                        ));
                    }
                }
                return new DeliveryReportResponse(userId, totalCount, totalQty, details);
            }
        });
    }

    /**
     * Ponto de integração acionado pelo backend a cada nova leitura real do
     * app: replica a leitura para o Oracle (criando o usuário por lá na
     * primeira vez, casado por email) e aciona PRC_REGISTER_CRITICAL_ALERT
     * sobre a linha recém-inserida.
     */
    public AlertResponse replicateReadingAndEvaluateAlert(
            String userEmail, String userName, String passwordHash,
            int systolic, int diastolic, Integer pulse, String notes, LocalDateTime measuredAt
    ) {
        Long oracleUserId = findOrCreateUser(userEmail, userName, passwordHash);
        Long readingId = insertReading(oracleUserId, systolic, diastolic, pulse, notes, measuredAt);
        return registerCriticalAlert(readingId);
    }

    private String classify(int systolic, int diastolic) {
        return oracleJdbcTemplate.execute((ConnectionCallback<String>) con -> {
            try (CallableStatement cs = con.prepareCall("{ ? = call fn_classify_bp(?, ?) }")) {
                cs.registerOutParameter(1, Types.VARCHAR);
                cs.setInt(2, systolic);
                cs.setInt(3, diastolic);
                cs.execute();
                return cs.getString(1);
            }
        });
    }

    private Long findOrCreateUser(String email, String name, String passwordHash) {
        List<Long> existing = oracleJdbcTemplate.query(
                "SELECT id FROM app_user WHERE email = ?", (rs, i) -> rs.getLong("id"), email);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        return oracleJdbcTemplate.execute((ConnectionCallback<Long>) con -> {
            try (CallableStatement cs = con.prepareCall(
                    "BEGIN "
                            + "INSERT INTO app_user (name, email, password_hash, role) "
                            + "VALUES (?, ?, ?, 'PATIENT') RETURNING id INTO ?; "
                            + "END;"
            )) {
                cs.setString(1, name);
                cs.setString(2, email);
                cs.setString(3, passwordHash);
                cs.registerOutParameter(4, Types.NUMERIC);
                cs.execute();
                return cs.getLong(4);
            }
        });
    }

    private Long insertReading(
            Long userId, int systolic, int diastolic, Integer pulse, String notes, LocalDateTime measuredAt
    ) {
        String classification = classify(systolic, diastolic);
        LocalDateTime effectiveMeasuredAt = measuredAt != null ? measuredAt : LocalDateTime.now();

        return oracleJdbcTemplate.execute((ConnectionCallback<Long>) con -> {
            try (CallableStatement cs = con.prepareCall(
                    "BEGIN "
                            + "INSERT INTO blood_pressure_reading "
                            + "(user_id, systolic, diastolic, pulse, notes, measured_at, classification) "
                            + "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id INTO ?; "
                            + "END;"
            )) {
                cs.setLong(1, userId);
                cs.setInt(2, systolic);
                cs.setInt(3, diastolic);
                if (pulse != null) {
                    cs.setInt(4, pulse);
                } else {
                    cs.setNull(4, Types.NUMERIC);
                }
                cs.setString(5, notes);
                cs.setTimestamp(6, Timestamp.valueOf(effectiveMeasuredAt));
                cs.setString(7, classification);
                cs.registerOutParameter(8, Types.NUMERIC);
                cs.execute();
                return cs.getLong(8);
            }
        });
    }
}
