# Indian Railways PNR Check #
Polls the Indian Railways server for updates and sends and email when the status changes

### Usage

 - Install `redis` if it isn't already. This [link](http://redis.io/download) has a simple tutorial.

 - `npm install` once you are in the root directory of the project
 
 - Edit the `config.json` file
	  - `gmail_username/gmail_password`: Add a gmail username and password to send an email
	  - `destination_email`: Add a destination email to receive the email when the results are out
	  - `smtpServer`: Mail Server to use
	  - `interval`: Check for the status after every x milliseconds
	  - `pnr`: PNR number to be used

 - Set the `log4js` output file

 - `node index.js` or `forever start index.js`

####Modules Used

 - [Cheerio](https://github.com/cheeriojs/cheerio): Required for parsing the HTML response
 - [Request](https://github.com/request/request): Most popular HTTP(S) module for Node.js
 - [Log4js](https://github.com/nomiddlename/log4js-node): Log messages with their timestamps
 - [emailjs](https://github.com/eleith/emailjs): Required for sending an email when the results are out
 - [redis](https://github.com/mranney/node_redis): Required for storing the last checked status of the PNR
