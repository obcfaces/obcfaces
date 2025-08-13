-- Create 30 real users for the contest
WITH user_data AS (
  SELECT 
    gen_random_uuid() as id,
    'user' || (row_number() OVER()) || '@contest.com' as email,
    names.name,
    names.first_name,
    names.last_name,
    cities.city,
    (20 + (random() * 10))::int as age,
    (50 + (random() * 20))::int as weight_kg,
    (160 + (random() * 20))::int as height_cm
  FROM (
    VALUES 
      ('Anna Cruz', 'Anna', 'Cruz'),
      ('Sofia Reyes', 'Sofia', 'Reyes'), 
      ('Isabella Garcia', 'Isabella', 'Garcia'),
      ('Camila Torres', 'Camila', 'Torres'),
      ('Valentina Lopez', 'Valentina', 'Lopez'),
      ('Emma Rodriguez', 'Emma', 'Rodriguez'),
      ('Mia Hernandez', 'Mia', 'Hernandez'),
      ('Gabriela Martinez', 'Gabriela', 'Martinez'),
      ('Lucia Gonzalez', 'Lucia', 'Gonzalez'),
      ('Victoria Morales', 'Victoria', 'Morales'),
      ('Alejandra Silva', 'Alejandra', 'Silva'),
      ('Andrea Vargas', 'Andrea', 'Vargas'),
      ('Natalia Castillo', 'Natalia', 'Castillo'),
      ('Daniela Ruiz', 'Daniela', 'Ruiz'),
      ('Paula Jimenez', 'Paula', 'Jimenez'),
      ('Carolina Perez', 'Carolina', 'Perez'),
      ('Mariana Santos', 'Mariana', 'Santos'),
      ('Fernanda Diaz', 'Fernanda', 'Diaz'),
      ('Adriana Castro', 'Adriana', 'Castro'),
      ('Paola Ortiz', 'Paola', 'Ortiz'),
      ('Claudia Ramos', 'Claudia', 'Ramos'),
      ('Monica Rivera', 'Monica', 'Rivera'),
      ('Veronica Flores', 'Veronica', 'Flores'),
      ('Sandra Aguilar', 'Sandra', 'Aguilar'),
      ('Patricia Mendez', 'Patricia', 'Mendez'),
      ('Elena Campos', 'Elena', 'Campos'),
      ('Diana Vega', 'Diana', 'Vega'),
      ('Cristina Romero', 'Cristina', 'Romero'),
      ('Beatriz Navarro', 'Beatriz', 'Navarro'),
      ('Carmen Delgado', 'Carmen', 'Delgado')
  ) AS names(name, first_name, last_name)
  CROSS JOIN (
    VALUES ('Manila'), ('Cebu'), ('Davao'), ('Quezon City'), ('Makati'), ('Pasig'), ('Taguig'), ('Antipolo'), ('Zamboanga'), ('Cagayan de Oro')
  ) AS cities(city)
  ORDER BY random()
  LIMIT 30
)
INSERT INTO public.profiles (
  id,
  display_name,
  first_name,
  last_name,
  country,
  city,
  age,
  height_cm,
  weight_kg,
  bio,
  gender,
  birthdate,
  created_at,
  updated_at
)
SELECT 
  id,
  name,
  first_name,
  last_name,
  'Philippines',
  city,
  age,
  height_cm,
  weight_kg,
  'Участвую в конкурсе красоты. Мечтаю стать моделью!',
  'female',
  (CURRENT_DATE - (age || ' years')::interval)::date,
  now(),
  now()
FROM user_data;