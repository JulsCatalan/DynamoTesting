const users_list = document.getElementById('users_list');

const getUsers = async () => {
    try {
        const response = await fetch('/get_users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();  

            const usersHtml = data.map(user => `
                <h3>ID de Usuario: ${user.testingId.S}</h3>
                <p class="user_data">Nombre: ${user.Name.S}</p>
                <p class="user_data">Correo: ${user.Mail.S}</p>
            `).join('');  

            users_list.innerHTML = usersHtml;
        } else {
            console.error('Error en la solicitud:', response.statusText);
        }
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
    }
};

getUsers();

const refreshUsersList = async () => {
    await getUsers();  
};

document.getElementById('add_form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const name = document.getElementById('add_name').value;
    const mail = document.getElementById('add_mail').value;

    try {
        const response = await fetch('/add_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, mail })
        });

        if (response.ok) {
            alert('Usuario insertado con éxito');
            await refreshUsersList();
              
        } else {
            alert('Algo salió mal');
        }
    } catch (error) {
        alert('Error en la conexión: ' + error.message);
    }
});

document.getElementById('delete_form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const id = document.getElementById('delete_id').value;

    try {
        const response = await fetch('/delete_user',{
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });
        if (response.ok) {
            alert('Usuario eliminado con éxito');
            await refreshUsersList();  
        } else {
            alert('Algo salió mal');
        }
    } catch (error) {
        alert('Error en la conexión: ' + error.message);
    }
});

document.getElementById('update_form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const user_id = document.getElementById('user_id').value;
    const name = document.getElementById('update_name').value;
    const mail = document.getElementById('update_mail').value;

    try {
        const response = await fetch('/update_user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: user_id, name, mail })
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Datos de ${data.Name.S} actualizados`);
            await refreshUsersList();  
        } else {
            const errorData = await response.json(); 
            alert(`Error: ${errorData.message}`);
        }
    } catch (error) {
        alert('Error en la conexión: ' + error.message);
    }
});
