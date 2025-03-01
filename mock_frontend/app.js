
// autoConnect is set to false so the connection is not established right away. 
// We will manually call socket.connect() once we specify the username.
const socket = io('ws://localhost:3001', { autoConnect: false });
const id = localStorage.getItem('id');
socket.auth = { user_id: id };
socket.connect();

console.log(id);

socket.on('message', text => {

    const el = document.createElement('li');
    el.innerHTML = text;
    document.querySelector('ul').appendChild(el)

});

document.querySelector('button').onclick = () => {
    
    const messageContent = document.getElementById('message').value;
    const senderId = document.getElementById('senderId').value;
    const receiverId = document.getElementById('receiverId').value;
    console.log(senderId, receiverId)
    socket.emit('message', {"senderId": senderId, "receiverId": receiverId, "content": messageContent})
    
}