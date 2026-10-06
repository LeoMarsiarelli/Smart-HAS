-- =============================================================================
-- Smart HAS — Oracle Database: dados simulados (seed)
-- =============================================================================
-- Simula: usuários (1 admin + 2 pacientes), histórico de leituras de sensor
-- (pressão arterial) ao longo do tempo, e pedidos de entrega de medicamento.
-- As senhas abaixo são hashes fictícios apenas para fins de demonstração.
-- =============================================================================

INSERT INTO app_user (name, email, password_hash, role)
VALUES ('Admin Smart HAS', 'admin@smarthas.com', '$2a$10$demoHashAdmin', 'ADMIN');

INSERT INTO app_user (name, email, password_hash, role)
VALUES ('Maria Silva', 'maria@smarthas.com', '$2a$10$demoHashMaria', 'PATIENT');

INSERT INTO app_user (name, email, password_hash, role)
VALUES ('Joao Teste', 'joao.teste@smarthas.com', '$2a$10$demoHashJoao', 'PATIENT');

COMMIT;

-- -----------------------------------------------------------------------------
-- Histórico de leituras de sensor (pressão arterial) — Maria Silva
-- -----------------------------------------------------------------------------
INSERT INTO blood_pressure_reading (user_id, systolic, diastolic, pulse, notes, measured_at, classification)
SELECT id, 118, 76, 70, 'Em jejum', SYSTIMESTAMP - INTERVAL '10' DAY, 'NORMAL'
FROM app_user WHERE email = 'maria@smarthas.com';

INSERT INTO blood_pressure_reading (user_id, systolic, diastolic, pulse, notes, measured_at, classification)
SELECT id, 126, 79, 72, 'Pós-caminhada', SYSTIMESTAMP - INTERVAL '7' DAY, 'ELEVADA'
FROM app_user WHERE email = 'maria@smarthas.com';

INSERT INTO blood_pressure_reading (user_id, systolic, diastolic, pulse, notes, measured_at, classification)
SELECT id, 134, 86, 75, 'Manhã', SYSTIMESTAMP - INTERVAL '3' DAY, 'HAS_ESTAGIO_1'
FROM app_user WHERE email = 'maria@smarthas.com';

INSERT INTO blood_pressure_reading (user_id, systolic, diastolic, pulse, notes, measured_at, classification)
SELECT id, 148, 94, 82, 'Após o trabalho', SYSTIMESTAMP - INTERVAL '1' DAY, 'HAS_ESTAGIO_2'
FROM app_user WHERE email = 'maria@smarthas.com';

-- -----------------------------------------------------------------------------
-- Histórico de leituras de sensor — Joao Teste (inclui uma crise hipertensiva)
-- -----------------------------------------------------------------------------
INSERT INTO blood_pressure_reading (user_id, systolic, diastolic, pulse, notes, measured_at, classification)
SELECT id, 122, 78, 68, 'Rotina', SYSTIMESTAMP - INTERVAL '5' DAY, 'ELEVADA'
FROM app_user WHERE email = 'joao.teste@smarthas.com';

INSERT INTO blood_pressure_reading (user_id, systolic, diastolic, pulse, notes, measured_at, classification)
SELECT id, 190, 125, 100, 'Mal-estar relatado', SYSTIMESTAMP - INTERVAL '2' HOUR, 'CRISE_HIPERTENSIVA'
FROM app_user WHERE email = 'joao.teste@smarthas.com';

COMMIT;

-- -----------------------------------------------------------------------------
-- Pedidos de entrega de medicamento (AI Logistics Extension)
-- -----------------------------------------------------------------------------
INSERT INTO medication_delivery_request (
    user_id, medication_name, quantity, delivery_address, requested_at,
    risk_score, priority, estimated_window_start, estimated_window_end, status
)
SELECT id, 'Losartana 50mg', 2, 'Rua das Flores, 123 - Sao Paulo/SP',
       SYSTIMESTAMP - INTERVAL '1' DAY, 50, 'MEDIA',
       SYSTIMESTAMP - INTERVAL '1' DAY + INTERVAL '4' HOUR,
       SYSTIMESTAMP - INTERVAL '1' DAY + INTERVAL '8' HOUR,
       'ENTREGUE'
FROM app_user WHERE email = 'maria@smarthas.com';

INSERT INTO medication_delivery_request (
    user_id, medication_name, quantity, delivery_address, requested_at,
    risk_score, priority, estimated_window_start, estimated_window_end, status
)
SELECT id, 'Captopril 25mg', 1, 'Rua Teste, 1 - Sao Paulo/SP',
       SYSTIMESTAMP - INTERVAL '2' HOUR, 95, 'URGENTE',
       SYSTIMESTAMP + INTERVAL '1' HOUR, SYSTIMESTAMP + INTERVAL '2' HOUR,
       'PENDENTE'
FROM app_user WHERE email = 'joao.teste@smarthas.com';

INSERT INTO medication_delivery_request (
    user_id, medication_name, quantity, delivery_address, requested_at,
    risk_score, priority, estimated_window_start, estimated_window_end, status
)
SELECT id, 'Hidroclorotiazida 25mg', 3, 'Rua Teste, 1 - Sao Paulo/SP',
       SYSTIMESTAMP - INTERVAL '6' DAY, 30, 'BAIXA',
       SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '5' DAY + INTERVAL '6' HOUR,
       'ENTREGUE'
FROM app_user WHERE email = 'joao.teste@smarthas.com';

COMMIT;

PROMPT Dados simulados inseridos com sucesso.
