/*Developed by: Arun Thayanithy
	 S.N. - 100887220
	 Course - COMP 2406
	 Assignment 3
	 Date : March 16th, 2017
*/

var temp;
var counter=0;
var blockedUsers = [];
//Upon loading the page the following code will be executed
$(document).ready(function(){
	
	//This chunk of code checks for bad userName inputs, and will prompt the user to type it again otherwise
	counter = 0;
	userName = '';
	while(($.trim(userName)).length==0){
		//var userName = prompt("What's your name?");
		if(counter != 0){
			userName = prompt("Enter a valid name please:")
		}else{
			userName = prompt("What is your name?");	
		}
		counter++;
	}
	
	//A socket io connection is initialized, and an intro event is emitted with the username as the data
	var socket = io(); //connect to the server that sent this page
	socket.on('connect', function(){
		socket.emit("intro", userName);
	});
	
	//Upon a userList emit from the server, the client will handle the information and populate the userlist
	socket.on("userList", function(data) {
		var bool = false;
		//console.log("userList successful");
		temp = data;
		//This will replace the userList every single time, so no repeats appear after another user disconnects
		$("#userLister").html('');
		
		//This will cycle through the data received and create a userlist
		for(var i in data){
			$("#userLister").append("<tr><td><div id='user"+i+"'><img src='test2.png' height='15' width='15'>"+data[i]+"</div></td></tr>");
			console.log($("#user"+i).text());
			//Since a new userlist is generated upon a client disconnect, this will check if any existing users on the userlist have been previously been blocked, and if that's the case to toggle the strike through class
			if(blockedUsers.indexOf(data[i]) != -1){
				$("#user"+i).toggleClass("strike");
			}
			console.log("This socket username is ", userName);
			//Each user is binded with a double click listener and handler 
			$("#user"+i).bind('dblclick', function(e){
				console.log("This has been run upon loading the for loop");
				//If the current user is equal to the username, the listener is turned off, as we won't send messages or block ourselves
				if($(this).text() == userName){
					$(this).unbind(e);
				} else {
					//If the user holds down the shift key the following code is executed
					if(e.shiftKey){
						$(this).toggleClass("strike");
						//A strike class is toggled and the necessary class info is sent to the server as a blockUser event 
						if($(this).attr('class') == "strike"){
							socket.emit("blockUser", $(this).text());
							blockedUsers.push($(this).text());
						}else{
							socket.emit("blockUser", $(this).text());
							blockedUsers.splice(blockedUsers.indexOf($(this).text()), 1);
						}
					//If the user didn't hold down shift, the following will execute a private message
					} else {
						var text2send = prompt("Enter your private message to "+$(this).text()+".");
						var answer = {};
						answer.user = $(this).text();
						answer.message = text2send;
						//If the message is blank or contains no message the program won't emit the info
						if(($.trim(text2send)).length==0){
							console.log("Only white spaces");
						}else{ 
						//If it does the script will emit the private message with the target user, and message to send
							console.log("More than white spaces");
							console.log("Answer is ", answer);
							socket.emit("privateMessage", answer);
						}
					}
				}
			});
		}
		
	}); 
	
	//Input text as taken from tutorial 7 - not changed - Credit Andrew Runka
	$('#inputText').keypress(function(ev){
			if(ev.which===13){
				socket.emit("message",$(this).val());
				ev.preventDefault(); 
				$("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
				$(this).val(""); 
			}
	});
	
	//Input text as taken from tutorial 7 - not changed - Credit Andrew Runka
	socket.on("message",function(data){
		$("#chatLog").append(data+"\n");
		$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
	});
	
	
	//Upon a privateMessage event the script will respond 
	socket.on("privateMessage", function(data){
		console.log("Incoming data is ", data);
		//What the user sent along with their username
		var reply = prompt(data.user+" has sent you a private message\n"+data.text+"\nEnter your message back\n");
		//Respond to the respective user if the text entered is not white space or blank
		if(($.trim(reply)).length==0){
			console.log("Only white spaces");
		}else{
			replyObject = {};
			replyObject.user = data.user;
			replyObject.message = reply;
			socket.emit("privateMessage", replyObject);
		}	
	});
	
	//Upon receiving a blockUser emit from the server, this script will respond 
	socket.on("blockUser", function(data){
		//If the data received from the server is literally equal to blocked add the following to the chatlog
		if(data == "blocked"){
			//alert("Message not sent, you have been blocked by the user");
			$("#chatLog").append("Message not sent, you have been blocked by the user\n").css("color","red");
			setTimeout(function(){
				$("#chatLog").css("color","black");
			}, 1000);
			$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight;
		} else {
			//If the data received was not blocked, show the following, which shows the target user has unblocked the current user
			$("#chatLog").append(data+"\n");
			$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight;
		}				
	});


});