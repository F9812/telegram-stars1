// script.js

document.querySelectorAll('.open-case-btn').forEach(button => {
    button.addEventListener('click', async () => {
        const price = parseInt(button.dataset.price);
        const userId = 1;  // Для теста можно использовать фиксированный ID пользователя

        const response = await fetch('/open_case', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, case_price: price })
        });

        const data = await response.json();
        const resultElement = document.getElementById('prize-result');
        
        if (data.error) {
            resultElement.innerText = data.error;
        } else {
            resultElement.innerHTML = `
                🎁 Ты открыл кейс и выиграл: ${data.prize[0]} - ${data.prize[1]} ⭐
                <br>Твой новый баланс: ${data.balance} ⭐
            `;
        }

        // Обновляем баланс на странице
        document.getElementById('balance').innerText = data.balance;
    });
});
