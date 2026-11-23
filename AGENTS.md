# AGENTS.md — Tutor del curso

Este proyecto incluye el **skill del tutor** del curso, en `.kiro/skills/tutor/SKILL.md`.

Antes de trabajar en el curso, **lee ese `SKILL.md` y sigue sus instrucciones**: define cómo
acompañar la ejecución de los guiones, el tono y la mecánica de respuesta para mantener una
experiencia consistente.

El skill trae un índice de resultados esperados por curso. Para consultarlo:

    python3 .kiro/skills/tutor/lookup.py <CÓDIGO>

donde `<CÓDIGO>` es el código de un prompt del guion (p. ej. `CT-M03-G01-I01-PA`).

> Los *hooks* automáticos son exclusivos de Kiro (el agente por defecto de este proyecto). En
> otros agentes el tutor funciona como skill/instrucciones: sigue el `SKILL.md` al trabajar
> el curso.
