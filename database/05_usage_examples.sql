-- =============================================================================
-- Smart HAS — Oracle Database: exemplos práticos de uso
-- =============================================================================
-- Demonstra as functions integradas a consultas SQL e o EXEC das procedures,
-- usando os dados simulados de 02_seed_data.sql.
-- =============================================================================

SET SERVEROUTPUT ON;

PROMPT ===========================================================
PROMPT 1) FN_CLASSIFY_BP e FN_CALC_RISK_SCORE usadas em um SELECT
PROMPT ===========================================================
SELECT
    u.name                                        AS paciente,
    r.systolic || '/' || r.diastolic               AS pressao,
    fn_classify_bp(r.systolic, r.diastolic)        AS classificacao_calculada,
    fn_calc_risk_score(r.systolic, r.diastolic)    AS risk_score_calculado
FROM blood_pressure_reading r
JOIN app_user u ON u.id = r.user_id
ORDER BY r.measured_at;

PROMPT ===========================================================
PROMPT 2) FN_GET_USER_SUMMARY para cada paciente
PROMPT ===========================================================
SELECT id, fn_get_user_summary(id) AS resumo
FROM app_user
WHERE role = 'PATIENT';

PROMPT ===========================================================
PROMPT 3) PRC_REGISTER_CRITICAL_ALERT — registrando alertas a partir
PROMPT    das leituras críticas já existentes
PROMPT ===========================================================
DECLARE
    CURSOR c_critical IS
        SELECT id
        FROM blood_pressure_reading
        WHERE classification IN ('HAS_ESTAGIO_2', 'CRISE_HIPERTENSIVA');
BEGIN
    FOR r IN c_critical LOOP
        prc_register_critical_alert(r.id);
        DBMS_OUTPUT.PUT_LINE('Alerta avaliado para leitura id=' || r.id);
    END LOOP;
END;
/

SELECT a.id, u.name AS paciente, a.alert_level, a.message
FROM sensor_alert a
JOIN app_user u ON u.id = a.user_id
ORDER BY a.created_at;

PROMPT ===========================================================
PROMPT 4) PRC_USER_DELIVERY_REPORT — relatório de entregas do Joao
PROMPT ===========================================================
DECLARE
    v_user_id     app_user.id%TYPE;
    v_total_count NUMBER;
    v_total_qty   NUMBER;
    v_details     SYS_REFCURSOR;

    v_medication  medication_delivery_request.medication_name%TYPE;
    v_quantity    medication_delivery_request.quantity%TYPE;
    v_status      medication_delivery_request.status%TYPE;
    v_priority    medication_delivery_request.priority%TYPE;
    v_requested   medication_delivery_request.requested_at%TYPE;
BEGIN
    SELECT id INTO v_user_id FROM app_user WHERE email = 'joao.teste@smarthas.com';

    prc_user_delivery_report(v_user_id, v_total_count, v_total_qty, v_details);

    DBMS_OUTPUT.PUT_LINE('Total de pedidos: ' || v_total_count);
    DBMS_OUTPUT.PUT_LINE('Total de unidades: ' || v_total_qty);
    DBMS_OUTPUT.PUT_LINE('--- Detalhe ---');

    LOOP
        FETCH v_details INTO v_medication, v_quantity, v_status, v_priority, v_requested;
        EXIT WHEN v_details%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(
            v_medication || ' x' || v_quantity
            || ' | ' || v_status || ' | ' || v_priority
            || ' | ' || TO_CHAR(v_requested, 'DD/MM/YYYY HH24:MI')
        );
    END LOOP;
    CLOSE v_details;
END;
/

PROMPT ===========================================================
PROMPT 5) Tratamento de exceção — usuário inexistente
PROMPT ===========================================================
DECLARE
    v_total_count NUMBER;
    v_total_qty   NUMBER;
    v_details     SYS_REFCURSOR;
BEGIN
    prc_user_delivery_report(999999, v_total_count, v_total_qty, v_details);
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Erro esperado capturado: ' || SQLERRM);
END;
/
