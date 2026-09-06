-- Un solo buzón para varios proyectos.
--
-- El monitor ya funciona, está probado y no falla. Montar uno nuevo por cada
-- proyecto es rehacer lo que ya aguanta. Con esta columna, cualquier proyecto
-- manda su feedback al mismo sitio y se ve separado al leerlo.
--
-- Por defecto 'fonomundos': las filas que ya existen no se mueven, y el juego
-- no necesita cambiar nada para seguir igual.
alter table feedback
  add column if not exists proyecto text not null default 'fonomundos';

create index if not exists feedback_proyecto on feedback (proyecto, created_at desc);
