-- =============================================================================
-- Smart HAS — Oracle Database: Functions PL/SQL
-- =============================================================================
-- FN_CLASSIFY_BP      -> helper reutilizável (classifica pressão arterial)
-- FN_CALC_RISK_SCORE  -> indicador relevante ao projeto (score de risco 0-100)
-- FN_GET_USER_SUMMARY -> dados formatados relevantes ao projeto (resumo textual)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FN_CLASSIFY_BP
-- Classifica uma leitura de pressão arterial segundo a diretriz simplificada
-- da Sociedade Brasileira de Cardiologia. Reutilizada por FN_CALC_RISK_SCORE
-- e pode ser chamada diretamente em qualquer SELECT.
-- Parâmetros:
--   p_systolic  (IN)  - pressão sistólica (mmHg)
--   p_diastolic (IN)  - pressão diastólica (mmHg)
-- Retorno:
--   VARCHAR2 com a classificação (NORMAL | ELEVADA | HAS_ESTAGIO_1 |
--   HAS_ESTAGIO_2 | CRISE_HIPERTENSIVA)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_classify_bp(
    p_systolic  IN blood_pressure_reading.systolic%TYPE,
    p_diastolic IN blood_pressure_reading.diastolic%TYPE
) RETURN VARCHAR2
IS
    v_classification VARCHAR2(30);
BEGIN
    IF p_systolic IS NULL OR p_diastolic IS NULL THEN
        RAISE_APPLICATION_ERROR(-20010, 'Sistólica e diastólica são obrigatórias para classificar a leitura.');
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
        RAISE_APPLICATION_ERROR(-20011, 'Erro ao classificar pressão arterial: ' || SQLERRM);
END fn_classify_bp;
/

-- -----------------------------------------------------------------------------
-- FN_CALC_RISK_SCORE  (indicador relevante ao projeto)
-- Calcula o score de risco (0-100) usado pela camada AI Logistics Extension
-- para priorizar a entrega de medicamentos, a partir da classificação da
-- pressão arterial. Mesma regra aplicada pelo LogisticsAiService (Java),
-- agora também disponível diretamente no banco para consultas e procedures.
-- Parâmetros:
--   p_systolic  (IN) - pressão sistólica (mmHg)
--   p_diastolic (IN) - pressão diastólica (mmHg)
-- Retorno:
--   NUMBER (0-100) representando o risco calculado
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calc_risk_score(
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
/

-- -----------------------------------------------------------------------------
-- FN_GET_USER_SUMMARY  (dados formatados relevantes ao projeto)
-- Monta uma string de resumo do paciente: nome, última leitura de pressão
-- (com classificação e data) e quantidade de entregas pendentes.
-- Usa CURSOR explícito para buscar a leitura mais recente.
-- Parâmetros:
--   p_user_id (IN) - id do usuário/paciente
-- Retorno:
--   VARCHAR2 formatado, pronto para exibição (ex.: em relatórios/consultas)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_user_summary(
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
/

PROMPT Functions criadas com sucesso.
