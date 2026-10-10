# AGENTS.md — continuidad MovePilot AI — moveapp

Reglas compartidas para Codex, Antigravity y agentes de programación autorizados.

## Inicio de sesión
- Leer `HANDOFF.md` y `AGENTS.md` antes de cualquier edición; inspeccionar la documentación específica necesaria.
- Identificar entorno local o cloud, directorio, rama, commit (`git rev-parse --short HEAD`) y cambios existentes (`git status --short`).
- Verificar el estado real del código, pruebas y documentación. No confundir una idea histórica o un README con despliegue/funcionamiento probado.
- Si se dispone de permiso para leer la memoria central privada, consultar **solo** el contexto relevante (projects/movepilot/CONTEXT.md), nunca la memoria íntegra innecesariamente.

## Checkpoints durante el trabajo
- Actualizar `HANDOFF.md` después de cada bloque funcional comprobado y antes de operaciones de alto riesgo, una pausa o cambio de agente.
- Incluir objetivo, fecha y agente, rama/commit, archivos tocados, cambios sin commit, comandos de prueba ejecutados y resultado real, decisiones, bloqueos y siguiente paso preciso.
- Preservar el estado del código existente, aunque aún no esté publicado. Nunca marcar una prueba como exitosa si no se ejecutó.
- Si los tokens se agotan inesperadamente, el siguiente agente recupera `HANDOFF.md` y el árbol de trabajo actual. No existe cambio automático de agente ni garantía de capturar razonamiento no escrito.

## Traspaso Codex ↔ Antigravity
- Al retomar: leer checkpoint, revisar `git status` y diffs, ejecutar pruebas relevantes y continuar sin rehacer el trabajo anterior.
- No ejecutar `git reset`, `git clean`, `git checkout -- .`, ni sobrescribir código ajeno sin autorización explícita.
- Para trabajo simultáneo, coordinar o usar ramas/worktrees separados. Para cloud, asegurar acceso explícito a commits/ramas; la copia local no se comparte automáticamente.
- No incluir secretos, claves, tokens, información personal sensible, ni datos de clientes en `HANDOFF.md` ni en repositorios públicos.

## Publicación y aprobación
- No hacer push, desplegar, borrar datos ni actualizar memoria global sin autorización expresa del usuario.
- No actualizar estado de producción sin fuente verificable. Mantener la transferencia de trabajo documentada, mínima y orientada a la próxima acción.
