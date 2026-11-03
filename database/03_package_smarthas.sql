-- =============================================================================
-- Smart HAS — Oracle Database: Package PL/SQL (SMARTHAS_PKG)
-- =============================================================================
-- Consolida em um único package tudo o que antes eram objetos PL/SQL soltos
-- (functions e procedures da fase anterior), garantindo organização e reuso:
-- um único ponto de entrada, nomes qualificados (smarthas_pkg.xxx) e menor
-- risco de colisão de nomes com outros schemas/objetos.
--
-- Membros:
--   FN_CLASSIFY_BP            -> classifica a pressão arterial
--   FN_CALC_RISK_SCORE        -> indicador de risco (0-100)
--   FN_GET_USER_SUMMARY       -> resumo formatado do paciente (CURSOR)
--   PRC_REGISTER_CRITICAL_ALERT -> registra alerta a partir de leitura crítica
--   PRC_USER_DELIVERY_REPORT  -> relatório de entregas por usuário (CURSOR+LOOP)
--   PRC_SEARCH_READINGS       -> busca flexível de leituras com DYNAMIC SQL
-- =============================================================================

CREATE OR REPLACE PACKAGE smarthas_pkg AS

    -- Classifica a pressão arterial (NORMAL | ELEVADA | HAS_ESTAGIO_1 |
    -- HAS_ESTAGIO_2 | CRISE_HIPERTENSIVA), segundo a diretriz simplificada
    -- da Sociedade Brasileira de Cardiologia.
    FUNCTION fn_classify_bp(
        p_systolic  IN blood_pressure_reading.systolic%TYPE,
        p_diastolic IN blood_pressure_reading.diastolic%TYPE
    ) RETURN VARCHAR2;

    -- Indicador de risco (0-100) usado pela AI Logistics Extension,
    -- derivado de fn_classify_bp.
    FUNCTION fn_calc_risk_score(
        p_systolic  IN NUMBER,
        p_diastolic IN NUMBER
    ) RETURN NUMBER;

    -- Resumo formatado do paciente (nome, última leitura, entregas pendentes).
    FUNCTION fn_get_user_summary(
        p_user_id IN app_user.id%TYPE
    ) RETURN VARCHAR2;

    -- Registra um alerta em SENSOR_ALERT quando a leitura indicada é
    -- HAS_ESTAGIO_2/CRISE_HIPERTENSIVA. Acionada pelo backend Java
    -- (REST -> Java -> JDBC -> Oracle) a cada nova leitura.
    PROCEDURE prc_register_critical_alert(
        p_reading_id IN blood_pressure_reading.id%TYPE
    );

    -- Relatório resumido de entregas por usuário: total de pedidos/unidades
    -- (CURSOR + LOOP explícitos) e detalhe via REF CURSOR de saída.
    PROCEDURE prc_user_delivery_report(
        p_user_id     IN  app_user.id%TYPE,
        p_total_count OUT NUMBER,
        p_total_qty   OUT NUMBER,
        p_details     OUT SYS_REFCURSOR
    );

    -- Busca flexível de leituras de pressão, com filtros todos opcionais
    -- (usuário, classificação, data mínima) e ordenação configurável —
    -- implementada com Dynamic SQL (a query é montada em tempo de execução,
    -- pois nem o WHERE nem o ORDER BY são conhecidos em tempo de compilação).
    PROCEDURE prc_search_readings(
        p_user_id        IN  NUMBER    DEFAULT NULL,
        p_classification IN  VARCHAR2  DEFAULT NULL,
        p_since          IN  TIMESTAMP DEFAULT NULL,
        p_order_by       IN  VARCHAR2  DEFAULT 'MEASURED_AT_DESC',
        p_cursor         OUT SYS_REFCURSOR
    );

END smarthas_pkg;
/

CREATE OR REPLACE PACKAGE BODY smarthas_pkg AS

    FUNCTION fn_classify_bp(
        p_systolic  IN blood_pressure_reading.systolic%TYPE,
        p_diastolic IN blood_pressure_reading.diastolic%TYPE
    ) RETURN VARCHAR2
    IS
        v_classification VARCHAR2(30);
    BEGIN
        IF p_systolic IS NULL OR p_diastolic IS NULL THEN
            RAISE_APPLICATION_ERROR(-20010, 'Sistolica e diastolica sao obrigatorias para classificar a leitura.');
        END IF;

        IF p_systolic >= 180 OR p_diastolic >= 120 THEN
            v_classification := 'CRISE_HIPERTENSIVA';
        ELSIF p_systolic >= 140 OR p_diastolic >= 90 THEN
            v_classification := 'HAS_ESTAGIO_2';
        ELSIF p_systolic >= 130 OR p_diastolic >= 80 THEN
            v_classification := 'HAS_ESTAGIO_1';
        ELSIF p_systolic >= 120 THEN
            v_classification := 'ELEVADA';
        ELSE
            v_classification := 'NORMAL';
        END IF;

        RETURN v_classification;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20011, 'Erro ao classificar pressao arterial: ' || SQLERRM);
    END fn_classify_bp;

    FUNCTION fn_calc_risk_score(
        p_systolic  IN NUMBER,
        p_diastolic IN NUMBER
    ) RETURN NUMBER
    IS
        v_classification VARCHAR2(30);
        v_score          NUMBER(3);
    BEGIN
        v_classification := fn_classify_bp(p_systolic, p_diastolic);

        v_score := CASE v_classification
            WHEN 'CRISE_HIPERTENSIVA' THEN 95
            WHEN 'HAS_ESTAGIO_2'      THEN 75
            WHEN 'HAS_ESTAGIO_1'      THEN 50
            WHEN 'ELEVADA'            THEN 30
            ELSE 15
        END;

        RETURN v_score;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20012, 'Erro ao calcular risk score: ' || SQLERRM);
    END fn_calc_risk_score;

    FUNCTION fn_get_user_summary(
        p_user_id IN app_user.id%TYPE
    ) RETURN VARCHAR2
    IS
        v_name           app_user.name%TYPE;
        v_systolic       blood_pressure_reading.systolic%TYPE;
        v_diastolic      blood_pressure_reading.diastolic%TYPE;
        v_classification VARCHAR2(30);
        v_measured_at    blood_pressure_reading.measured_at%TYPE;
        v_pending_count  NUMBER;
        v_summary        VARCHAR2(400);

        CURSOR c_last_reading IS
            SELECT systolic, diastolic, classification, measured_at
            FROM blood_pressure_reading
            WHERE user_id = p_user_id
            ORDER BY measured_at DESC
            FETCH FIRST 1 ROW ONLY;
    BEGIN
        SELECT name INTO v_name FROM app_user WHERE id = p_user_id;

        OPEN c_last_reading;
        FETCH c_last_reading INTO v_systolic, v_diastolic, v_classification, v_measured_at;

        IF c_last_reading%NOTFOUND THEN
            CLOSE c_last_reading;
            RETURN 'Paciente: ' || v_name || ' | Nenhuma leitura registrada';
        END IF;
        CLOSE c_last_reading;

        SELECT COUNT(*) INTO v_pending_count
        FROM medication_delivery_request
        WHERE user_id = p_user_id AND status = 'PENDENTE';

        v_summary := 'Paciente: ' || v_name
            || ' | Ultima PA: ' || v_systolic || '/' || v_diastolic
            || ' (' || v_classification || ')'
            || ' em ' || TO_CHAR(v_measured_at, 'DD/MM/YYYY HH24:MI')
            || ' | Entregas pendentes: ' || v_pending_count;

        RETURN v_summary;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN 'Paciente nao encontrado (id=' || p_user_id || ')';
        WHEN OTHERS THEN
            IF c_last_reading%ISOPEN THEN
                CLOSE c_last_reading;
            END IF;
            RAISE_APPLICATION_ERROR(-20013, 'Erro ao montar resumo do paciente: ' || SQLERRM);
    END fn_get_user_summary;

    PROCEDURE prc_register_critical_alert(
        p_reading_id IN blood_pressure_reading.id%TYPE
    )
    IS
        v_user_id        blood_pressure_reading.user_id%TYPE;
        v_systolic       blood_pressure_reading.systolic%TYPE;
        v_diastolic      blood_pressure_reading.diastolic%TYPE;
        v_classification VARCHAR2(30);
        v_level          VARCHAR2(20);
        v_message        VARCHAR2(400);
    BEGIN
        SELECT user_id, systolic, diastolic, classification
        INTO   v_user_id, v_systolic, v_diastolic, v_classification
        FROM   blood_pressure_reading
        WHERE  id = p_reading_id;

        IF v_classification = 'CRISE_HIPERTENSIVA' THEN
            v_level := 'CRITICO';
        ELSIF v_classification = 'HAS_ESTAGIO_2' THEN
            v_level := 'ATENCAO';
        ELSE
            RETURN; -- leitura nao critica: nao gera alerta
        END IF;

        v_message := 'Leitura ' || v_systolic || '/' || v_diastolic
            || ' classificada como ' || v_classification
            || ' em ' || TO_CHAR(SYSTIMESTAMP, 'DD/MM/YYYY HH24:MI');

        -- O INSERT abaixo dispara automaticamente a trigger de auditoria
        -- TRG_SENSOR_ALERT_AUDIT (ver 04_triggers.sql), que grava o evento
        -- em AUDIT_LOG sem nenhuma chamada explícita desta procedure.
        INSERT INTO sensor_alert (user_id, reading_id, alert_level, message)
        VALUES (v_user_id, p_reading_id, v_level, v_message);

        COMMIT;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20020, 'Leitura nao encontrada: ' || p_reading_id);
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE_APPLICATION_ERROR(-20021, 'Erro ao registrar alerta: ' || SQLERRM);
    END prc_register_critical_alert;

    PROCEDURE prc_user_delivery_report(
        p_user_id     IN  app_user.id%TYPE,
        p_total_count OUT NUMBER,
        p_total_qty   OUT NUMBER,
        p_details     OUT SYS_REFCURSOR
    )
    IS
        CURSOR c_deliveries IS
            SELECT quantity
            FROM medication_delivery_request
            WHERE user_id = p_user_id;

        v_qty         medication_delivery_request.quantity%TYPE;
        v_user_exists NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_user_exists FROM app_user WHERE id = p_user_id;
        IF v_user_exists = 0 THEN
            RAISE_APPLICATION_ERROR(-20030, 'Usuario nao encontrado: ' || p_user_id);
        END IF;

        p_total_count := 0;
        p_total_qty   := 0;

        OPEN c_deliveries;
        LOOP
            FETCH c_deliveries INTO v_qty;
            EXIT WHEN c_deliveries%NOTFOUND;
            p_total_count := p_total_count + 1;
            p_total_qty   := p_total_qty + NVL(v_qty, 0);
        END LOOP;
        CLOSE c_deliveries;

        OPEN p_details FOR
            SELECT medication_name, quantity, status, priority, requested_at
            FROM medication_delivery_request
            WHERE user_id = p_user_id
            ORDER BY requested_at DESC;
    EXCEPTION
        WHEN OTHERS THEN
            IF c_deliveries%ISOPEN THEN
                CLOSE c_deliveries;
            END IF;
            RAISE_APPLICATION_ERROR(-20031, 'Erro ao gerar relatorio de entregas: ' || SQLERRM);
    END prc_user_delivery_report;

    PROCEDURE prc_search_readings(
        p_user_id        IN  NUMBER    DEFAULT NULL,
        p_classification IN  VARCHAR2  DEFAULT NULL,
        p_since          IN  TIMESTAMP DEFAULT NULL,
        p_order_by       IN  VARCHAR2  DEFAULT 'MEASURED_AT_DESC',
        p_cursor         OUT SYS_REFCURSOR
    )
    IS
        v_sql       VARCHAR2(2000);
        v_order_col VARCHAR2(100);
    BEGIN
        -- O ORDER BY não pode ser parametrizado com bind variable (Oracle não
        -- permite bind de identificador de coluna/expressão) — por isso é
        -- resolvido contra uma whitelist fixa e só então concatenado na
        -- string. Nunca concatenamos p_order_by bruto: isso evitaria SQL
        -- Injection via esse parâmetro.
        v_order_col := CASE UPPER(p_order_by)
            WHEN 'MEASURED_AT_ASC' THEN 'r.measured_at ASC'
            WHEN 'SYSTOLIC_DESC'   THEN 'r.systolic DESC'
            WHEN 'RISK_DESC'       THEN 'smarthas_pkg.fn_calc_risk_score(r.systolic, r.diastolic) DESC'
            ELSE 'r.measured_at DESC'
        END;

        v_sql := 'SELECT r.id, r.user_id, u.name, r.systolic, r.diastolic, ' ||
                 '       r.classification, r.measured_at ' ||
                 'FROM blood_pressure_reading r ' ||
                 'JOIN app_user u ON u.id = r.user_id ' ||
                 'WHERE 1 = 1';

        -- WHERE montado dinamicamente: só entram na query (e na lista de
        -- binds) os filtros que o chamador realmente informou.
        IF p_user_id IS NOT NULL THEN
            v_sql := v_sql || ' AND r.user_id = :p_user_id';
        END IF;
        IF p_classification IS NOT NULL THEN
            v_sql := v_sql || ' AND r.classification = :p_classification';
        END IF;
        IF p_since IS NOT NULL THEN
            v_sql := v_sql || ' AND r.measured_at >= :p_since';
        END IF;

        v_sql := v_sql || ' ORDER BY ' || v_order_col;

        -- OPEN FOR exige que a lista USING bata exatamente com os binds
        -- presentes na string montada — por isso os ramos abaixo, um para
        -- cada combinação de filtros ativos.
        IF p_user_id IS NOT NULL AND p_classification IS NOT NULL AND p_since IS NOT NULL THEN
            OPEN p_cursor FOR v_sql USING p_user_id, p_classification, p_since;
        ELSIF p_user_id IS NOT NULL AND p_classification IS NOT NULL THEN
            OPEN p_cursor FOR v_sql USING p_user_id, p_classification;
        ELSIF p_user_id IS NOT NULL AND p_since IS NOT NULL THEN
            OPEN p_cursor FOR v_sql USING p_user_id, p_since;
        ELSIF p_classification IS NOT NULL AND p_since IS NOT NULL THEN
            OPEN p_cursor FOR v_sql USING p_classification, p_since;
        ELSIF p_user_id IS NOT NULL THEN
            OPEN p_cursor FOR v_sql USING p_user_id;
        ELSIF p_classification IS NOT NULL THEN
            OPEN p_cursor FOR v_sql USING p_classification;
        ELSIF p_since IS NOT NULL THEN
            OPEN p_cursor FOR v_sql USING p_since;
        ELSE
            OPEN p_cursor FOR v_sql;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20040, 'Erro na busca dinamica de leituras: ' || SQLERRM);
    END prc_search_readings;

END smarthas_pkg;
/

PROMPT Package SMARTHAS_PKG (spec + body) criado com sucesso.
