export function answerQuestion(body: string): any {
  return {
    data: {
      answer: 'Respuesta simulada: consulta la documentación pública del centro.',
      citations: [
        {
          documentId: '11111111-1111-4111-8111-111111111111',
          title: 'Guía pública del centro',
          excerpt: 'La información actualizada está disponible en los canales oficiales.',
        },
      ],
    }
  };
}