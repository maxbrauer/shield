# SHIELD - Sistema de Hidro-Intercepcion y Deflexion Electronica de Lluvia Dirigida

## Objetivo

Disenar y desarrollar un dispositivo capaz de generar ondas o algun mecanismo fisico para repeler gotas de agua y viento, con el fin de desviar lluvias intensas de una zona especifica.

## Descripcion del Proyecto

SHIELD busca crear una barrera invisible o semi-visible que desvie la trayectoria de las gotas de lluvia antes de que alcancen una zona protegida. No se trata de cubrir fisicamente el area (como un techo o toldo), sino de alterar la trayectoria de las gotas mediante fuerzas fisicas.

## Lineas de Investigacion

### 1. Ondas de Presion Acustica (Ultrasonido)

- Transductores ultrasonicos que generan campos de presion acustica
- Levitacion acustica: ondas estacionarias que pueden suspender y desviar particulas de agua
- Frecuencias en el rango de 20-40 kHz con arreglos de fase (phased arrays)
- Ventaja: sin contacto, sin residuos
- Desafio: escalar la potencia para gotas grandes y lluvia intensa

### 2. Cortinas de Aire (Air Curtains)

- Ventiladores de alta velocidad que generan un flujo laminar de aire
- Usados industrialmente en puertas de edificios
- Se pueden orientar para desviar lluvia en angulo
- Ventaja: tecnologia probada y disponible
- Desafio: consumo energetico alto, ruidoso a gran escala

### 3. Campos Electrostaticos

- Las gotas de lluvia tienen carga electrica natural
- Electrodos de alto voltaje pueden desviar gotas cargadas
- Principio similar a la deflexion de chorro de agua con carga estatica
- Ventaja: bajo consumo energetico relativo
- Desafio: seguridad electrica, efectividad variable segun condiciones

### 4. Ondas Electromagneticas / Plasma

- Generacion de plasma frio en la atmosfera
- Calentamiento localizado del aire para crear corrientes de conveccion
- Ventaja: potencialmente muy efectivo
- Desafio: tecnologia compleja, alto consumo energetico

### 5. Vibracion Mecanica de Superficies

- Superficies vibratorias que repelen agua por efecto hidrofobico dinamico
- Membranas piezoelectricas oscilando a alta frecuencia
- Ventaja: simple de implementar a pequena escala
- Desafio: limitado a superficies, no crea barrera en el aire

## Arquitectura del Prototipo (Fase 1)

```
                    LLUVIA
                   |  |  |  |
                   v  v  v  v
    ========================================
    |   ARRAY DE TRANSDUCTORES / EMISORES  |  <-- Barrera activa
    ========================================
              \   desvio   /
               \    de    /
                \ gotas  /
                 \      /
                  v    v
    ----------------------------------------
    |        ZONA PROTEGIDA                |
    ----------------------------------------
```

### Componentes del Sistema

1. **Modulo de Deteccion**
   - Sensor de lluvia (intensidad, tamano de gota, direccion)
   - Anemometro (velocidad y direccion del viento)
   - Sensor de humedad ambiental

2. **Modulo de Control**
   - Microcontrolador (ESP32 / Arduino / Raspberry Pi)
   - Algoritmo de ajuste dinamico segun condiciones
   - Interfaz de monitoreo (app o dashboard web)

3. **Modulo de Emision/Deflexion**
   - Arreglo de actuadores (segun linea de investigacion elegida)
   - Sistema de alimentacion electrica
   - Mecanismo de orientacion motorizado

4. **Modulo de Energia**
   - Fuente de alimentacion principal
   - Bateria de respaldo
   - Opcion de panel solar para autonomia

## Parametros de Diseno

| Parametro                  | Valor Objetivo           |
|----------------------------|--------------------------|
| Area de proteccion         | 2m x 2m (prototipo)     |
| Intensidad de lluvia max   | 50 mm/h (lluvia fuerte) |
| Velocidad de viento max    | 40 km/h                 |
| Consumo energetico max     | 500W (prototipo)        |
| Nivel de ruido max         | 70 dB                   |
| Peso del sistema           | < 20 kg                 |
| Eficiencia de deflexion    | > 80%                   |

## Fases del Proyecto

### Fase 0 - Investigacion (actual)
- [ ] Revision bibliografica de cada linea de investigacion
- [ ] Analisis de viabilidad tecnica y economica
- [ ] Seleccion de la tecnologia mas prometedora
- [ ] Identificar materiales y componentes disponibles

### Fase 1 - Prototipo de Laboratorio
- [ ] Disenar circuito y mecanismo a escala reducida
- [ ] Simular con gotas de agua controladas (spray/aspersor)
- [ ] Medir eficiencia de deflexion
- [ ] Iterar diseno

### Fase 2 - Prototipo Funcional
- [ ] Escalar a tamano real (2m x 2m)
- [ ] Pruebas con lluvia artificial
- [ ] Integrar sensores y control automatico
- [ ] Optimizar consumo energetico

### Fase 3 - Pruebas de Campo
- [ ] Pruebas con lluvia real
- [ ] Ajuste de parametros en condiciones variables
- [ ] Documentar resultados y limitaciones

### Fase 4 - Producto
- [ ] Diseno industrial
- [ ] Reduccion de costos
- [ ] Manual de instalacion y uso

## Referencias y Recursos

### Papers y Articulos Relevantes
- Levitacion acustica: principios y aplicaciones
- Electrohidrodinamica: manipulacion de fluidos con campos electricos
- Cortinas de aire: diseno y eficiencia
- Superficies superhidrofobicas y efecto Leidenfrost

### Tecnologias Relacionadas
- Cortinas de aire industriales (Berner, Mars Air)
- Transductores ultrasonicos de potencia
- Generadores Van de Graaff y fuentes de alto voltaje
- Phased arrays acusticos

### Herramientas de Simulacion
- COMSOL Multiphysics (simulacion de ondas y fluidos)
- OpenFOAM (dinamica de fluidos computacional)
- MATLAB/Simulink (modelado de sistemas de control)
- Arduino IDE / PlatformIO (firmware de control)

## Estructura del Repositorio

```
shield/
├── README.md              # Este archivo
├── docs/                  # Documentacion detallada
│   ├── investigacion/     # Papers, notas de investigacion
│   ├── diseno/            # Esquemas, diagramas, CAD
│   └── resultados/        # Datos de pruebas y analisis
├── firmware/              # Codigo del microcontrolador
│   ├── sensores/          # Lectura de sensores
│   ├── control/           # Algoritmo de control
│   └── actuadores/        # Control de emisores
├── hardware/              # Disenos de circuitos y PCB
│   ├── esquematicos/      # Diagramas de circuito
│   └── pcb/               # Disenos de PCB
├── simulaciones/          # Modelos y simulaciones
├── app/                   # Dashboard de monitoreo
└── tests/                 # Pruebas y mediciones
```

## Notas

- La solucion mas viable para un primer prototipo probablemente sea una combinacion de cortina de aire + ultrasonido
- Considerar el efecto combinado: el aire desvía gotas grandes y el ultrasonido las gotas finas/niebla
- El enfoque electrostatico es interesante pero requiere mas investigacion sobre la carga natural de las gotas de lluvia en condiciones reales
- La escalabilidad es el desafio principal: lo que funciona en laboratorio con gotas individuales puede no funcionar con lluvia intensa

## Licencia

Proyecto de investigacion y desarrollo. Licencia por definir.
