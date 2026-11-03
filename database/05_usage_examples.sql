-- =============================================================================
-- Smart HAS — Oracle Database: exemplos práticos de uso (Package + Triggers)
-- =============================================================================
-- Demonstra o package SMARTHAS_PKG, as triggers de auditoria disparando
-- automaticamente, e a busca dinâmica (Dynamic SQL) com diferentes
-- combinações de filtros — usando os dados simulados de 02_seed_data.sql.
-- =============================================================================

SET SERVEROUTPUT ON;

PROMPT ===========================================================
PROMPT 1) Functions do package em um SELECT
PROMPT ===========================================================
SELECT
    u.name                                                     AS paciente,
    r.systolic || '/' || r.diastolic                           AS pressao,
    smarthas_pkg.fn_classify_bp(r.systolic, r.diastolic)       AS classificacao_calculada,
    smarthas_pkg.fn_calc_risk_score(r.systolic, r.diastolic)   AS risk_score_calculado
FROM blood_pressure_reading r
JOIN app_user u ON u.id = r.user_id
ORDER BY r.measured_at;

PROMPT ===========================================================
PROMPT 2) FN_GET_USER_SUMMARY para cada paciente
PROMPT ===========================================================
SELECT id, smarthas_pkg.fn_get_user_summary(id) AS resumo
FROM app_user
WHERE role = 'PATIENT';

PROMPT ===========================================================
PROMPT 3) PRC_REGISTER_CRITICAL_ALERT — e a trigger TRG_SENSOR_ALERT_AUDIT
PROMPT    disparando automaticamente em cada alerta criado
PROMPT ===========================================================
DECLARE
    CURSOR c_critical IS
        SELECT id
        FROM blood_pressure_reading
        WHERE classification IN ('HAS_ESTAGIO_2', 'CRISE_HIPERTENSIVA');
BEGIN
    FOR r IN c_critical LOOP
        smarthas_pkg.prc_register_critical_alert(r.id);
        DBMS_OUTPUT.PUT_LINE('Alerta avaliado para leitura id=' || r.id);
    END LOOP;
END;
/

SELECT a.id, u.name AS paciente, a.alert_level, a.message
FROM sensor_alert a
JOIN app_user u ON u.id = a.user_id
ORDER BY a.created_at;

PROMPT >>> Conferindo o AUDIT_LOG gerado automaticamente pela trigger
SELECT table_name, operation, record_id, new_value, changed_at
FROM audit_log
WHERE table_name = 'SENSOR_ALERT'
ORDER BY changed_at;

PROMPT ===========================================================
PROMPT 4) TRG_DELIVERY_STATUS_AUDIT — atualizando o status de um pedido
PROMPT    de entrega e conferindo o rastro automático no AUDIT_LOG
PROMPT ===========================================================
UPDATE medication_delivery_request
SET status = 'EM_ROTA'
WHERE medication_name = 'Captopril 25mg' AND status = 'PENDENTE';
COMMIT;

SELECT table_name, operation, record_id, old_value, new_value, changed_at
FROM audit_log
WHERE table_name = 'MEDICATION_DELIVERY_REQUEST'
ORDER BY changed_at;

PROMPT ===========================================================
PROMPT 5) PRC_USER_DELIVERY_REPORT — relatório de entregas do Joao
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

    smarthas_pkg.prc_user_delivery_report(v_user_id, v_total_count, v_total_qty, v_details);

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
PROMPT 6) PRC_SEARCH_READINGS — Dynamic SQL com filtros variados
PROMPT ===========================================================
DECLARE
    v_user_id        app_user.id%TYPE;
    v_cursor         SYS_REFCURSOR;
    v_id             NUMBER;
    v_uid            NUMBER;
    v_name           app_user.name%TYPE;
    v_systolic       NUMBER;
    v_diastolic      NUMBER;
    v_classification VARCHAR2(30);
    v_measured_at    TIMESTAMP;
BEGIN
    SELECT id INTO v_user_id FROM app_user WHERE email = 'maria@smarthas.com';

    DBMS_OUTPUT.PUT_LINE('--- (a) Só por usuário, ordenado por risco ---');
    smarthas_pkg.prc_search_readings(
        p_user_id => v_user_id, p_order_by => 'RISK_DESC', p_cursor => v_cursor
    );
    LOOP
        FETCH v_cursor INTO v_id, v_uid, v_name, v_systolic, v_diastolic, v_classification, v_measured_at;
        EXIT WHEN v_cursor%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_systolic || '/' || v_diastolic || ' (' || v_classification || ')');
    END LOOP;
    CLOSE v_cursor;

    DBMS_OUTPUT.PUT_LINE('--- (b) Só por classificação (sem informar usuário) ---');
    smarthas_pkg.prc_search_readings(
        p_classification => 'CRISE_HIPERTENSIVA', p_cursor => v_cursor
    );
    LOOP
        FETCH v_cursor INTO v_id, v_uid, v_name, v_systolic, v_diastolic, v_classification, v_measured_at;
        EXIT WHEN v_cursor%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_systolic || '/' || v_diastolic || ' em ' || TO_CHAR(v_measured_at, 'DD/MM/YYYY HH24:MI'));
    END LOOP;
    CLOSE v_cursor;

    DBMS_OUTPUT.PUT_LINE('--- (c) Sem nenhum filtro (todas as leituras, mais recente primeiro) ---');
    smarthas_pkg.prc_search_readings(p_cursor => v_cursor);
    LOOP
        FETCH v_cursor INTO v_id, v_uid, v_name, v_systolic, v_diastolic, v_classification, v_measured_at;
        EXIT WHEN v_cursor%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_systolic || '/' || v_diastolic);
    END LOOP;
    CLOSE v_cursor;
END;
/

PROMPT ===========================================================
PROMPT 7) Tratamento de exceção — usuário inexistente
PROMPT ===========================================================
DECLARE
    v_total_count NUMBER;
    v_total_qty   NUMBER;
    v_details     SYS_REFCURSOR;
BEGIN
    smarthas_pkg.prc_user_delivery_report(999999, v_total_count, v_total_qty, v_details);
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Erro esperado capturado: ' || SQLERRM);
END;
/
