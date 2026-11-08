'use strict';
// Carregado no <head>, antes de a página aparecer: marca a temporada de Natal
// (outubro a dezembro) para a vitrine já nascer com o espaço reservado e não
// "empurrar" a página quando os produtos chegarem do banco.
if (new Date().getMonth() + 1 >= 10) document.documentElement.classList.add('natal-temporada');
