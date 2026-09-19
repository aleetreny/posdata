# Producto y criterios editoriales

Posdata ayuda a estudiantes que valoran un doctorado, doctorandos, titulados y orientadores a explorar destinos profesionales y contrastar su alcance con datos.

## Recorridos principales

1. **Explorar ejemplos:** disciplina → sector o empleador → perfil → historial y fuente. La universidad del doctorado y el empleador son campos independientes.
2. **Valorar una salida:** función profesional → ejemplos relacionados → organizaciones y puestos. Una opción se puede guardar localmente.
3. **Comparar resultados:** fuente y población → disciplina → momento → porcentajes, salario y denominador.
4. **Comprobar la evidencia:** historial individual, estudio, tabla original o ficha de fuente, según el resultado consultado.

## Contrato editorial

- Separar destinos previstos al graduarse, empleos observados e históricos de colocación.
- No convertir perfiles voluntarios en probabilidades poblacionales ni tratar un registro antiguo como empleo actual.
- Separar sector del empleador, función, disciplina y contrato. Una universidad privada se clasifica como educación.
- Conservar los datos originales, la evidencia de una corrección y los casos sin resolver.
- No sumar personas ni poblaciones que pueden solaparse. Un perfil ORCID no es una identidad independientemente verificada.
- Mantener visibles fecha, geografía, denominador, supresiones y límites junto a la información que califican.

## Alcance técnico

Aplicación estática en React y TypeScript, con Vite y GitHub Pages. Sin cuentas, servicios de pago ni analítica externa. Los filtros se procesan en el navegador mediante un worker; los historiales se descargan al abrirlos. Los enlaces conservan el estado del explorador y del atlas. Las opciones guardadas permanecen en el dispositivo.

La edición ORCID completa y su checksum son requisitos de publicación. Un extracto provisional nunca puede publicarse como edición completa. Las fuentes, sus licencias y los pasos de reproducción forman parte del producto.
