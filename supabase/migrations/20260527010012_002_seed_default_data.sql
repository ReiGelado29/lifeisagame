/*
  # Seed Default Data

  1. Insert Attribute Categories
    - Physical (Atributos Físicos)
    - Psychological (Atributos Psicológicos)
    - Knowledge (Conhecimento)

  2. Insert Default Attributes
    - Physical: Força, Velocidade, Resistência, Vigor, Agilidade
    - Psychological: Emocional, Autoestima, Felicidade, Autoconfiança
    - Knowledge: Matemática, Português, História, Geografia, Neurociências, Direito, Informática, Mecânica, Engenharia Civil, Engenharia Elétrica

  3. Insert Default Behaviors
    - All behaviors from the user's table with their stat effects
*/

-- Insert Attribute Categories
INSERT INTO attribute_categories (name, display_order) VALUES
('Físicos', 1),
('Psicológicos', 2),
('Conhecimento', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert Physical Attributes
INSERT INTO attributes (category_id, name, parent_id, display_order)
SELECT 
  (SELECT id FROM attribute_categories WHERE name = 'Físicos'),
  unnest(ARRAY['Força', 'Velocidade', 'Resistência', 'Vigor', 'Agilidade']),
  NULL,
  unnest(ARRAY[1, 2, 3, 4, 5])
ON CONFLICT (category_id, name, parent_id) DO NOTHING;

-- Insert Psychological Attributes
INSERT INTO attributes (category_id, name, parent_id, display_order)
SELECT 
  (SELECT id FROM attribute_categories WHERE name = 'Psicológicos'),
  unnest(ARRAY['Emocional', 'Autoestima', 'Felicidade', 'Autoconfiança']),
  NULL,
  unnest(ARRAY[1, 2, 3, 4])
ON CONFLICT (category_id, name, parent_id) DO NOTHING;

-- Insert Knowledge Attributes
INSERT INTO attributes (category_id, name, parent_id, display_order)
SELECT 
  (SELECT id FROM attribute_categories WHERE name = 'Conhecimento'),
  unnest(ARRAY['Matemática', 'Português', 'História', 'Geografia', 'Neurociências', 'Direito', 'Informática', 'Mecânica', 'Engenharia Civil', 'Engenharia Elétrica']),
  NULL,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
ON CONFLICT (category_id, name, parent_id) DO NOTHING;

-- Insert Behaviors with their effects
INSERT INTO behaviors (name, mental_energy, stable_dopamine, focus, stress, emotional_stability, fatigue, cognitive_overload, xp_reward, description) VALUES
('Dormir 7–9h', 30, 10, 25, -20, 20, -30, -15, 15, 'Recuperação neural, melhora atenção, humor e autocontrole'),
('Dormir menos de 5h', -35, -15, -30, 25, -20, 35, 20, 0, 'Lentidão mental, impulsividade, irritação, sonolência'),
('Dormir em horário consistente', 15, 10, 10, -10, 10, -10, -5, 10, 'Melhor ritmo circadiano'),
('Virar madrugada', -40, -20, -35, 30, -25, 40, 20, 0, 'Queda cognitiva acumulativa'),
('Exercício leve', 15, 10, 10, -15, 15, -5, -10, 10, 'Melhora circulação e humor'),
('Exercício intenso', 20, 20, 15, -20, 20, 10, -15, 20, 'Aumento de endorfina e sensação de progresso'),
('Sedentarismo prolongado', -15, -10, -10, 10, -10, 15, 10, 0, 'Lentidão física e mental'),
('Sol/luz natural', 10, 5, 5, -10, 10, -5, -5, 5, 'Regulação circadiana e humor'),
('Reels/TikTok curtos (5–10min)', 5, 5, -5, -2, 0, 2, 5, 0, 'Microestimulação'),
('Reels/TikTok longos (1h+)', -20, -25, -25, 10, -15, 15, 20, 0, 'Hiperestimulação dopaminérgica'),
('Pornografia compulsiva', -20, -35, -20, 15, -20, 10, 10, 0, 'Dessensibilização/recompensa rápida'),
('Jogos moderados', 10, 10, 5, -10, 5, -5, 5, 5, 'Relaxamento e recompensa'),
('Jogos excessivos', -15, -20, -15, 10, -10, 15, 15, 0, 'Dissociação/procrastinação'),
('Programação/estudo profundo', -10, 20, 30, 5, 15, 15, 10, 30, 'Flow, esforço cognitivo produtivo'),
('Multitarefa constante', -20, -10, -30, 20, -10, 20, 30, 5, 'Fragmentação de atenção'),
('Resolver pendência importante', 15, 20, 10, -20, 20, -5, -20, 25, 'Sensação de controle'),
('Acumular tarefas', -15, -10, -15, 25, -15, 10, 35, 0, 'Ansiedade cognitiva'),
('Ambiente organizado', 10, 5, 10, -10, 10, -5, -10, 5, 'Menor atrito mental'),
('Ambiente caótico', -10, -5, -15, 15, -10, 10, 20, 0, 'Sobrecarga visual/cognitiva'),
('Alimentação rica em proteína', 15, 10, 10, -5, 5, -5, 0, 10, 'Saciedade e estabilidade energética'),
('Açúcar excessivo', 10, 15, -10, 5, -5, 20, 10, 0, 'Pico e queda energética'),
('Jejum prolongado involuntário', -20, -10, -15, 15, -10, 15, 5, 0, 'Irritabilidade e queda de desempenho'),
('Hidratação adequada', 10, 5, 5, -5, 5, -10, 0, 5, 'Melhor funcionamento geral'),
('Desidratação', -15, -5, -10, 10, -5, 15, 5, 0, 'Dor de cabeça/fadiga'),
('Conversa social positiva', 10, 15, 5, -15, 20, -5, -5, 10, 'Regulação emocional'),
('Isolamento prolongado', -15, -10, -10, 15, -20, 10, 10, 0, 'Maior risco de tristeza/devaneio'),
('Música relaxante', 5, 5, 5, -10, 10, -5, -5, 5, 'Redução fisiológica de tensão'),
('Meditação/silêncio', 15, 5, 20, -20, 15, -10, -20, 15, 'Redução de hiperatividade mental'),
('Cafeína moderada', 15, 5, 15, 5, 0, -5, 5, 5, 'Aumento temporário de alerta'),
('Cafeína excessiva', -10, -10, -10, 20, -10, 15, 10, 0, 'Ansiedade/agitação'),
('Trabalhar muitas horas sem pausa', -30, -15, -25, 30, -15, 35, 25, 0, 'Exaustão executiva'),
('Pausa real sem tela', 15, 5, 10, -15, 10, -10, -15, 10, 'Recuperação cognitiva'),
('Scroll infinito antes de dormir', -20, -20, -15, 10, -10, 20, 15, 0, 'Piora do sono e hiperestimulação'),
('Concluir meta difícil', 20, 25, 15, -20, 25, -5, -10, 50, 'Reforço motivacional profundo'),
('Falhar repetidamente sem progresso', -20, -15, -10, 20, -25, 10, 15, 0, 'Sensação de impotência'),
('Caminhada ao ar livre', 15, 10, 10, -15, 15, -5, -10, 15, 'Regulação fisiológica e mental'),
('Consumo excessivo de notícias negativas', -10, -5, -10, 20, -15, 10, 20, 0, 'Hipervigilância/ansiedade'),
('Criar algo (arte/app/música)', 20, 25, 20, -10, 20, 5, -5, 40, 'Recompensa intrínseca e propósito')
ON CONFLICT (name) DO NOTHING;