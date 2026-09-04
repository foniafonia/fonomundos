-- El feedback puede incluir comentarios sensibles.
-- Se mantiene abierto el envio de reportes, pero se cierra la lectura publica.
drop policy if exists "feedback_select" on feedback;
