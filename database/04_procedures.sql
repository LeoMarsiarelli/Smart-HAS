-- =============================================================================
-- Smart HAS — Oracle Database: Procedures PL/SQL
-- =============================================================================
-- PRC_REGISTER_CRITICAL_ALERT -> registra alerta a partir de leitura crítica
--   (é a procedure acionada pelo backend Java: REST -> Java -> JDBC -> Oracle,
--    disparada automaticamente logo após o app salvar uma nova leitura)
-- PRC_USER_DELIVERY_REPORT    -> relatório resumido de entregas por usuário
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PRC_REGISTER_CRITICAL_ALERT
-- Lê uma leitura de pressão pelo id e, se a classificação indicar risco alto
-- (HAS_ESTAGIO_2 ou CRISE_HIPERTENSIVA), registra um alerta em SENSOR_ALERT.
-- Para leituras não críticas, a procedure simplesmente não gera alerta.
--
-- Integração com o backend: o endpoint POST /api/readings do Spring Boot,
-- após persistir a leitura, chama esta procedure via JDBC
-- (CallableStatement) passando o id da leitura recém-criada — reforçando a
-- inteligência do banco sem duplicar a regra no Java.
--
-- Parâmetros:
--   p_reading_id (IN) - id da leitura de pressão a avaliar
-- Exceções tratadas:
--   NO_DATA_FOUND -> leitura inexistente (erro customizado -20020)
--   OTHERS        -> qualquer outra falha, com ROLLBACK (erro -20021)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_register_critical_alert(
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
        -- Leitura não é crítica: encerra sem gerar alerta.
        RETURN;
    END IF;

    v_message := 'Leitura ' || v_systolic || '/' || v_diastolic
        || ' classificada como ' || v_classification
        || ' em ' || TO_CHAR(SYSTIMESTAMP, 'DD/MM/YYYY HH24:MI');

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
/

-- -----------------------------------------------------------------------------
-- PRC_USER_DELIVERY_REPORT
-- Gera um relatório resumido de entregas de medicamento por usuário:
-- total de pedidos, soma de unidades solicitadas (via CURSOR + LOOP
-- explícitos) e um cursor de saída (SYS_REFCURSOR) com o detalhe de cada
-- pedido, para a camada Java/Angular exibir uma lista completa sem precisar
-- repetir a query.
--
-- Parâmetros:
--   p_user_id     (IN)  - id do usuário/paciente
--   p_total_count (OUT) - quantidade de pedidos de entrega do usuário
--   p_total_qty   (OUT) - soma das quantidades solicitadas
--   p_details     (OUT) - cursor de referência com o detalhe dos pedidos
-- Exceções tratadas:
--   Usuário inexistente -> erro customizado -20030
--   OTHERS              -> fecha o cursor se necessário e relança (-20031)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_user_delivery_report(
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
/

PROMPT Procedures criadas com sucesso.
