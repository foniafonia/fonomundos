# Colmenia Vault

Repositorio de prompts de trabajo para Gabinete Fönia, Logoped-IA y Colmenia.
Todo en Markdown plano: funciona en Claude, ChatGPT, Obsidian, Claude Code o un editor de texto.

## Cómo se usa

1. Abre el `.md` que corresponda a la tarea.
2. Copia el bloque entero (rol + contexto + instrucciones).
3. Sustituye lo que va entre `[CORCHETES]`.
4. Pega el resultado en el chat y añade tus datos al final.

Los prompts de `clinica/` y `neae-aula/` se usan **siempre sin datos identificativos**: iniciales o alias, nunca nombre completo, DNI, centro ni fecha de nacimiento. La salida es un borrador; la validación clínica la pones tú.

## Estructura

| Carpeta | Para qué |
|---|---|
| `clinica/` | Evaluación, planes, informes y comunicación con familias |
| `neae-aula/` | Adaptación de materiales y coordinación con centros |
| `comunidad/` | LinkedIn, Telegram, reutilización de contenido |
| `institucional/` | ASMEL, CPR, UGR, administraciones |
| `producto/` | Colmenia como producto: cliente, mensaje, especificaciones |
| `sistema/` | Mantener el propio vault |

## Convenciones

- Un archivo = una tarea. Si un prompt hace dos cosas, se parte en dos.
- Cabecera fija en todos: **Rol / Contexto / Instrucciones / Salida**.
- Cuando un prompt se usa más de cinco veces al mes, se convierte en skill (`sistema/prompt-a-skill.md`).
- Revisión cada tres meses con `sistema/revision-trimestral.md`.

## Instalación como skills de Claude

```bash
# 1. Clona o copia la carpeta
cp -r colmenia-vault ~/Documentos/

# 2. Para usarla en Claude Code como contexto del proyecto
cd ~/Documentos/colmenia-vault
echo "Lee prompts/ antes de responder." > CLAUDE.md

# 3. Para Obsidian: abre la carpeta como bóveda. No hace falta nada más.
```
