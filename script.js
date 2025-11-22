// script.js

document.getElementById('getRandomBtn').addEventListener('click', async function() {
    // Отправляем запрос на сервер для получения случайного числа
    const response = await fetch('/get_random_number');
    const data = await response.json();

    // Выводим результат на странице
    document.getElementById('randomNumberContainer').innerHTML = `Случайное число: ${data.random_number}`;
});
