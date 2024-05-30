# Feebo - Contest Watcher Bot for Whatsapp

Hi! I'm Aniket Singh, the developer of **feebo**. I wanted to make my competitive programming life a little bit easier, so I created this bot. I hope you'll enjoy using it.

# How to setup the bot?
### Step 1:  Clone the repository in your local system
### Step 2: Install all the dependencies 

    npm install

### Step 3: Run the bot

    npm start
### Step 4: Scan the Qr,which is displayed in your terminal through your whatsapp > link devices
- This will open a web client of your WhatsApp in your terminal. Some authentication files will get installed. If you delete the 'auth_info_baileys' folder, you'll have to re-login through the QR code when you run 'index.js' next time, or else it will not ask for login again. 
### Step 5: Enjoy your bot - Basically you and bot share the same account.
- Your system should be connected to internet where the bot is running ,and you can stop the bot using ctrl+c in the terminal. 
# What does Feebo do?

Currently feebo supports **codeforces** , **atcoder**.
### User Can put the following commands through whatsapp chat.
>feebo
```
Hello, I am Feebo. How can I help you Aniket?

Enter command in form of
feebo command_no

            1) Add handle

            2) Show rating

            3) Show upcoming contests

            4) Get new questions

            for eg : feebo 1
```
   >feebo 1
```
  Enter your CF Handle. reply as 'feebo handle handle_name'

for eg : feebo handle aniket54
```
>feebo handle aniket54
```
handle saved successfully
```
>feebo 2
- This command will show user rating if he/she saved his/her handle successfully.
```
Your handle is aniket54
Your rating is 1327.
```
>feebo 3
- This command will show upcoming contests. for eg : 
```
Upcoming Contests

name : Kotlin Heroes: Episode 10
Time and date : 5/13/2024, 8:05:00 PM

name : Codeforces Round (Div. 2)
Time and date : 5/17/2024, 2:35:00 PM

name : Codeforces Round (Div. 3)
Time and date : 5/20/2024, 8:35:00 PM
```
>feebo 4
```
Write your demand as 'feebo get rating count',this will provide you 'count' no. of questions of 'rating' rating.

 for eg : feebo get 1500 4
```
 > feebo get 1500 4
```
Questions

Name : Zero Quantity Maximization

Link : https://codeforces.com/problemset/problem/1133/D

Name : Replace With the Previous, Minimize

Link : https://codeforces.com/problemset/problem/1675/E

Name : Polycarp and Div 3

Link : https://codeforces.com/problemset/problem/1005/D

Name : Anagram Search

Link : https://codeforces.com/problemset/problem/144/C

```

###  We'll add new features soon...