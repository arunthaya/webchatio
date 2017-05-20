/*- Developed by: Arun Thayanithy
*/

/*SocketIO based chat room. Extended to not echo messages
to the client that sent them.*/

var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var url = require('url');
var mime = require('mime-types');
const ROOT = "./files";

http.listen(2406);

console.log("Chat server listening on port 2406");
//var filter


//As taken from Andrew Runka from Tutorial 6
function handler(req,res){

	var urlObj = url.parse(req.url, true);
	var filename = ROOT+urlObj.pathname;

	fs.stat(filename, function(err, stats) {
		if(err){
			respondErr(err);
		}else{
			if(stats.isDirectory()) filename+= "/index.html";
			fs.readFile(filename, function(err, data){
				if(err)respondErr(err);
				else respond(200,data);
			});
		}
	});
	
	function serve404(){
		fs.readFile(ROOT+"/404.html","utf8",function(err,data){
			if(err)respond(500,err.message);
			else respond(404,data);
		});
	}
	
	function respondErr(err){
		console.log("Handling error: ",err);
		if(err.code==="ENOENT"){
			serve404();
		}else{
			respond(500,err.message);
		}
	}

	function respond(code, data){
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		res.end(data);
	}


};

clients = [];
var counter = 0;
var userRequestedBlock = [];
var usersBlocked = {};


//Upon a connection event from the script side, the following will be executed
io.on("connection", function(socket){
	console.log("Got a connection");
	
	//Upon an intro event, the user's socket info is added to a client array, and an empty blocked array is created under the user's name in the usersBlocked object
	socket.on("intro",function(data){
		socket.username = data;
		//Everyone except the current user will get the message that the user has entered the chatroom
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		//The new user will get the welcome message
		socket.emit("message","Welcome, "+socket.username+".");
		clients.push(socket);
		/*	User's socket info is pushed to the clients array
			All users will get a client list to be broadcasted as a userList event to be handled by the server
		*/
		socket.broadcast.emit("userList", getUserList());
		socket.emit("userList", getUserList());
		//usersBlocked will create a new array under the current user that is blank to be filled 
		usersBlocked[socket.username] = [];
		//console.log("clients is ", clients);
	});
	
	//Upon a message event from the client, the data will be pushed to everyone
	socket.on("message", function(data){
		var tempBlocked = [];
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);
		console.log("This user currently has blocked  ", usersBlocked[socket.username]);
		var toNotSendArray = [];
		
		
	});

	//The following will be executed upon a privateMessage event from the client side, with the data being pushed from the client
	socket.on("privateMessage", function(data){
		
		
		//This will loop through all users in the clients array 
		LOOP1:
		for(var i in clients){
			//If data.user from the client which is the target user the client wants to send a message to is found in the clients array run the following
			if (data.user == clients[i].username) {
				//A temp array to store the users blocked by the target user
				temporaryArray = usersBlocked[data.user];
				if(temporaryArray.length != 0){
					//This will return the index of the socket's username if found in the target user's blocked list, if it is, this means the target user doesn't want messages from the socket sending this request
					if(temporaryArray.indexOf(socket.username) == -1){
						var packageToSend = {};
						var temporary1 = clients[i].id;
						packageToSend.user = socket.username;
						packageToSend.text = data.message;
						io.to(temporary1).emit("privateMessage", packageToSend);
						break LOOP1;
					} else {
						//If the index returned was not equal to -1, which means the socket's username was blocked, the following will be sent back to the client sending the private message
						console.log("This message was blocked");
						var toSend = "blocked";
						socket.emit("blockUser", toSend);
						break LOOP1;
					}
				} else {
					//If the blocked array of the target array is blank, that means no user has been blocked and that the server can go ahead with the private message 
					var packageToSend = {};
					var temporary1 = clients[i].id;
					packageToSend.user = socket.username;
					packageToSend.text = data.message;
					//Store the target user's socket id, in order for the server to emit to that client 
					io.to(temporary1).emit("privateMessage", packageToSend);
					break LOOP1;
				}
			}
		}
			
	});
	
	//The following will execute from an incoming blockUser event from the client 
	socket.on("blockUser", function(data){
		//If the usersBlocked array doesn't have the user being sent from the client, that means the client wants the target user to be blocked
		if(usersBlocked[socket.username].indexOf(data) == -1){
			usersBlocked[socket.username].push(data);
			var stringToSend = data+ " has been blocked.";
			socket.emit("blockUser", stringToSend);
		} else {
			//If the usersBlocked array has the user being sent from the client, that means the client wants the target user to be unblocked
			console.log(data+" has been unblocked");
			var stringToSendAgain = data+ " has been unblocked.";
			var indexToRemove = usersBlocked[socket.username].indexOf(data);
			usersBlocked[socket.username].splice(indexToRemove, 1);
			socket.emit("blockUser", stringToSendAgain);
		}
	});
	
	//Disconnect event from the client as taken from Andrew Runka Tutorial 7 Skeleton
	socket.on("disconnect", function(){
		//console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");
		clients = clients.filter(function(ele){  
			return ele!==socket;
		});
		//console.log("Clients.length is ",clients.length);
		socket.broadcast.emit("userList", getUserList());
		socket.emit("userList", getUserList());
	});	
	
	
	
	
	
});

//Both preceeding functions taken from Andrew Runka's Tutorial 7 SKeleton 
function timestamp(){
	return new Date().toLocaleTimeString();
}

function getUserList(){
	var ret = [];
	for(var i=0; i<clients.length; i++){
		ret.push(clients[i].username);
	}
	return ret;
}
