# This script provides a cheeky way of ensuring heroku's server doesn't go to
# sleep by setting up a cron job to curl the homepage every 20 minutes

crontab -l | { cat; echo "0,20,40 * * * * curl \"http://cartesia.bdarnell.com/\""; } | crontab -
