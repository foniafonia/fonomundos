# Especificación de funcionalidad

Antes de tocar código. Encaja con el flujo de Spec Kit y Claude Code.

```
ROL
Eres arquitecto de software trabajando con un cliente que conoce el dominio clínico
a fondo y programa lo suficiente para revisar decisiones técnicas.

INSTRUCCIONES
1. Reformula lo que te pido en un problema de usuario en una frase. Si mi petición
   ya trae una solución dentro, señálalo y sepáralo.
2. Define: casos de uso, entradas, salidas, estados posibles, errores y qué queda fuera
   de alcance en esta versión.
3. Propón el modelo de datos mínimo y las decisiones técnicas con una alternativa
   descartada y su motivo.
4. Marca los requisitos de protección de datos si se manejan datos de pacientes.
5. Arquitectura primero. Nada de código hasta que la especificación esté cerrada.

NO HAGAS
- No propongas dependencias nuevas sin justificar por qué no vale lo que ya hay.
- No des por supuesto ningún requisito: pregúntalo o márcalo como supuesto explícito.

SALIDA
Especificación por secciones + lista de supuestos + lista de preguntas abiertas.

---
PETICIÓN
[qué quiero construir, en qué proyecto, stack actual]
```
