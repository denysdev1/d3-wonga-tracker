const form = document.querySelector('form');
const nameInput = document.querySelector('#name');
const costInput = document.querySelector('#cost');
const error = document.querySelector('#error');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (nameInput.value && costInput.value) {
    const item = {
      name: nameInput.value,
      cost: +costInput.value,
    };

    db.collection('expenses')
      .add(item)
      .then((res) => {
        error.textContent = '';
        nameInput.value = '';
        costInput.value = '';
      });
  } else {
    error.textContent = 'Please enter values before submitting';
  }
});
