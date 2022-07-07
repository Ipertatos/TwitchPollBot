//We load the .env file to get the environment variables
require('dotenv').config();

//We import tmi.js to connect to Twitch's API
const tmi = require('tmi.js');

//setup the variables needed for a single poll to work
var question = "none"; //the question for the poll
var options = []; //the options for the poll
var votes = []; //the votes for the poll
var voted = []; //the users who have voted for the poll

//re set the question because it was not working wihtout it.
question = "none";

//total amount of options given (it was from a previus attempt but too lazy to clean it up and it works just fine)
var option_count=0;

//Setup a client with the necessary options to connect to the bot account
const client = new tmi.Client({
    options: { debug: true,  messagesLogLevel: 'info' },//debugging options
    connection: {
        reconnect: true,//reconnect to the bot account if it disconnects
        secure: true //connect to the bot account securely
    },
    identity: {
        username: `${process.env.TWITCH_USERNAME}`, //the username of the bot account stored in the .env file
        password: `oauth:${process.env.TWITCH_OAUTH}` //the oauth token of the bot account stored in the .env file
    },
    channels:[`${process.env.TWITCH_CHANNEL}`] //the channel the bot account will respond to
});

//Attempt to client and log errors
client.connect().catch(console.error);

//Hit on every message sent to the channel
client.on('message', (channel, user, message, self) => {
    //if it is from the bot account itself, ignore it
    if (self) return;
    //get the message and split it into an array
    const args = message.split(' ');

    //get the first word of the message and lowercase it
    switch(args[0].toLowerCase()) {
        case '$commands': //if the user types $commands
            //print all of the above in a single message with a new line for each
            //we do it in a single line because you cant send multiple messages in a short time
            client.say(channel, '$commands - Lists all commands\n$makepoll - makes a poll(mods+)\n$vote - votes for a poll\n$results - shows the results of a poll and ends the poll');
            break;
        case '$makepoll': //if the user types $makepoll ($makepoll <amount_of_options> <option1> <option2> ... <question>)
            var uname = user['display-name'];//get the username of the user who made the poll
            //check if the user is a mod or the host itself
            if (user.mod || uname.toLowerCase() == process.env.TWITCH_CHANNEL.toLowerCase()) {
                //we set x as the total number of characters in the message to calculate when the question starts
                x=args[0].length+1; //the length of the command plus one for the space
                //get the amount of options
                const amount = args[1]; //the 1st argument is the amount of options
                x+=args[1].length+1; //the length of the amount of options plus one for the space
                //add the amount of options to a list
                for (let i = 0; i < amount; i++) { //for each option we get the next argument
                    options[i] = (args[i+2]); //add the option to the list(i+2 because the first two arguments are the amount of options and the question)
                    option_count++; //add one to the total amount of options (this is redundant but it works and it makes sure that the amount of options is correct)
                    x+=args[i+2].length+1; //add the length of the option plus one for the space
                }

                //The question is the rest of the message
                question = message.substring(x); 
                //we make a single string with the question and the options so we cant print in a single line to avoid sending multiple messages
                opt = `${question}\n`; 
                //We add the options to the string one by one
                for (let i = 0; i < options.length; i++) {
                    opt += `${i+1}: ${options[i]}\n`;
                }
                client.say(channel, opt); //We print the question and the options to the channel chat
                //We set the votes to 0 for each option so it doesn't panic
                for(let i = 0; i < option_count; i++)
                {
                    votes[i] = 0;
                }
            }
            break;
        case '$vote': //if the user types $vote ($vote <option_number>)
            if(question != "none") //If there is "none" in the question, it means that there is no poll
            {
            //We check if the user has already voted
            if (voted[user['display-name']]) {
                client.say(channel, `${user['display-name']} you have already voted for this poll`); //If the user has already voted, we print this message
            }
            else 
            {
                //We get the number the user voted for
                const option = args[1];

                //We check if the number is valid
                if (option > option_count) 
                {
                    client.say(channel, `${user['display-name']} the option you voted for is invalid`); //If the number is invalid, we print this message
                }
                else
                {
                    //We add the user to the list of voted users
                    voted[user['display-name']] = true;
                    //We add one to the amount of votes for the option the user voted for
                    votes[option-1] = votes[option-1] + 1;
                    //We confirm the vote to the channel chat
                    client.say(channel, `${user['display-name']} voted for ${option}`);
                }
            }
        }
            else //If there is no poll, we print this message
            {
                client.say(channel, `${user['display-name']} there is no poll to vote for`);
            }
    
            break;
        case '$results': //if the user types $results
            if(question != "none") //If there is "none" in the question, it means that there is no poll
            {
                
                //We make a string with the results of the poll so we can print it in a single message
                let results = `${question} is over!    \n`;
                //We add the results of each option to the string
                for (let i = 0; i < option_count; i++) {
                    results += `${i + 1}: ${options[i]} - ${votes[i]}\n`;
                }
                //We print the results to the channel chat
                client.say(channel, results);
                //We clear the question and the options so we can make a new poll
                question = "none";
                options = [];
                //We clear the list of voted users and the list of votes
                votes = [];
                voted = [];
                //We reset the amount of options
                option_count = 0;
            }
            else //If there is no poll, we print this message
            {
                client.say(channel, "There is no poll to show the results of");
            }
            break;
        }
}); 