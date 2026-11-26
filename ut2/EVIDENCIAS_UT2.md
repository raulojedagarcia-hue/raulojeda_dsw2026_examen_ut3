```npm run lint. Error: "7:9  error  'españa' is assigned a value but never used  @typescript-eslint/no-unused-vars." El error se basa en que hay un valor definido en algún lado, en este caso España, pero que no se usa en ningún lado, lo que es un error de progamación simple```

---

```npm run typecheck. Error: "8:7 - error TS2322: Type 'number' is not assignable to type 'string'." El error se basa en que hay una incompatibilidad, typecheck revisa el proyecto y en este caso, encuentra que hemos declarado una constante PORT que espera una string a la cual le estamos asignando un número, por lo tanto, es incompatible. Este comando se basa en las normas generales de TypeScript para revisar el código.```

---

```npm run build. Error: "8:7 - error TS2322: Type 'number' is not assignable to type 'string'." El error es el mismo que el anterior, en este caso, npm run build comprueba el código y, según la configuración de nuestro proyecto genera JavaScript en dist/. Este comando como bien he mencionado, se basa en nuestra configuración para revisar el proyecto.```