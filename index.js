var request = require('request'),
    cheerio = require('cheerio'),
    config = require('./config.json'),
    log4js = require('log4js'),
    jar = request.jar(),
    redis = require("redis"),
    client = redis.createClient();

var pnrCheckURL = 'http://www.indianrail.gov.in/cgi_bin/inet_pnstat_cgi_10521.cgi',

    // User Agent string.
    ua = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
    
    // setInterval handle for the checkPNR function
    handle = '',
    
    email = require('emailjs'),
    
    mailServer = email.server.connect({
        user: config.gmail_username,
        password: config.gmail_password,
        host: config.smtpServer,
        ssl: true
    }),

    mailMessage = {
        from: "PNR Update Notifier<" + config.gmail_username + ">",
        subject: "PNR Updates",
        to: config.destination_email
    };

// Configure logger
log4js.configure({ 
    appenders: [
        {   
            type: 'file',
            filename: "./log",
            category: 'info',
            maxLogSize: 2048000,
            backups: 10
        }
    ]
});

var logger = log4js.getLogger('info');

    // Uncomment to debug.
    // logger = console;    

// Send an email to destination_email when the status changes.
var sendMail = function(status, oldStatus) {

    // Edit the email text as required.
    mailMessage.text = "PNR Status for ticket " + config.pnr
                        + " has changed to " + status + " from " + oldStatus;
    
    mailServer.send(mailMessage, function(err, message) {
        if (err) {
            logger.error(err);
            logger.error("Error sending mail");
            return;
        }

        logger.info("Mail sent successfully");
    });
};

var checkPNR = function() {
    logger.info("Checking for updates...");
    request.post({
        url: pnrCheckURL,
        jar: jar,
        headers: {
            "User-Agent": ua,
            "Referer" : "http://www.indianrail.gov.in/pnr_Enq.html"
        },

        // Fake captcha.
        form: {
            "lccp_pnrno1": config.pnr,
            "lccp_cap_val": "12345",
            "lccp_capinp_val": "12345"
        }
    }, function(e, r, body) {

        if (e) {
            logger.error("checkPNR Request Failed", e);
            return;
        }

        if(body.indexOf('You Queried For') < 0){

            // Something is wrong.
            // Possible when the server does not return expected HTML.
            // Server side issues.
            
            logger.log("Something is wrong!");
            return;
        }

        var $ = cheerio.load(body),

            // Current Status field
            status = $('td.table_border_both').eq(10).text();

        client.get("status", function (err, reply) {
            if(err){
                logger.error("Error fetching details from redis", err);
                
                clearInterval(handle);
                client.quit();
                return;
            }

            // reply is nil for the first run.
            reply = reply || "";

            var oldStatus = reply.toString();
            if(oldStatus !== status){
                // Something has changed

                client.set("status", status);
                logger.log("Status has changed");

                sendMail(status, oldStatus);
            }else{
                //logger.log("Status hasn't changed");
            }
        });
    });
};

client.on("connect", function () {
    logger.log("Client connected");
    handle = setInterval(checkPNR, 3000);
});
