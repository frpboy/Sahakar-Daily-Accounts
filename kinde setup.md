Quick start

Securely integrate a new or existing application to the Kinde platform



Technology

Change technology

NextJS

Starter kit

Existing codebase

Where is your project running?

The URLs used in this guide are based on this value



http://localhost:3000 Edit



Add the Kinde NextJS SDK as a dependency

Install the SDK





npx nypm add @kinde-oss/kinde-auth-nextjs

Update environment vars

Create a .env.local file in the root of your project and copy/paste the below values into it





KINDE\_CLIENT\_ID=f45549431a8f46deadfb224f824b8039

KINDE\_CLIENT\_SECRET=\*\* Hidden until copied \*\*

KINDE\_ISSUER\_URL=https://doams.kinde.com

KINDE\_SITE\_URL=http://localhost:3000

KINDE\_POST\_LOGOUT\_REDIRECT\_URL=http://localhost:3000

KINDE\_POST\_LOGIN\_REDIRECT\_URL=http://localhost:3000/dashboard

API endpoints

Create the following file src/app/api/auth/\[kindeAuth]/route.js inside your NextJS project. Inside the file route.js put this code:





import {handleAuth} from "@kinde-oss/kinde-auth-nextjs/server";



export const GET = handleAuth();

This will handle Kinde Auth endpoints in your NextJS app.



Important! Our SDK relies on this file existing in this location specified above.



Add sign up and sign in buttons

The SDK ships with <LoginLink> and <RegisterLink> components which can be used to start the auth flow.





import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";



<LoginLink>Sign in</LoginLink>



<RegisterLink>Sign up</RegisterLink>

Open your project in a browser

You should see sign in and registration buttons



Sign up your first user

Register your first user and view their profile on the Users page







KINDE\_CLIENT\_ID=f45549431a8f46deadfb224f824b8039

KINDE\_CLIENT\_SECRET=rCurKZiyeatjIlIeW3xggOwVX8vjAsvESfgeT2xhKBxJ0fmlzjM4m

KINDE\_ISSUER\_URL=https://doams.kinde.com

KINDE\_SITE\_URL=http://localhost:3000

KINDE\_POST\_LOGOUT\_REDIRECT\_URL=http://localhost:3000

KINDE\_POST\_LOGIN\_REDIRECT\_URL=http://localhost:3000/dashboard











Next.js App Router SDK

Complete guide for Next.js App Router SDK.



New to Kinde? Kinde is the all-in-one developer platform for authentication, access management and billing - secure and monetize your SaaS from day one. Get started for free



Next.js version 13 or later

This SDK is for Next.js version 13+ and uses Server Side Components and App Router. See Version compatibility



If you’re using version 1 see Next.js App Router V1



If you’re using the pages router see Next.js Pages Router



What you need

Link to this section

A Kinde account (Sign up for free)

Node.js version 20 or higher

Set up a Kinde application

Link to this section

Sign in to your Kinde dashboard and select Add application

Enter a name for the application (e.g., “My Next.js App”)

Select Back-end web as the application type, then select Save.

On the Quick start page, select NextJS from the list of back-end SDKs, then select Save.

nextjs sdk



Option 1: Install the Starter kit

Link to this section

On the Quick start page, select Set for both callback URL and logout URL. This will set http://localhost:3000 as your default URLs. If you want to use a different URL, you can change it in the Details page.



Download the Next.js starter kit



Go to the root of your project and install the dependencies:



Terminal window

cd kinde-nextjs-app-router-starter-kit

npm install



Create an environment variable file:



Terminal window

cp .env.local.sample .env.local



Copy the environment variables from the Quick start page to the .env.local file and save changes.



Start the development server:



Terminal window

npm run dev



Open the browser and navigate to http://localhost:3000 to see the application.



Sign-up for a new user.



Option 2: Install for an existing project

Link to this section

On the Quick start page, select Existing codebase, and edit your project URL (defaults to http://localhost:3000)



Select Set for both callback URL and logout URL.

Open your project in your terminal and install the Kinde dependency with the following command:



npm

yarn

pnpm

Terminal window

npm i @kinde-oss/kinde-auth-nextjs



Create the Kinde auth endpoint:



Terminal window

mkdir -p "app/api/auth/\[kindeAuth]"

touch "app/api/auth/\[kindeAuth]/route.ts"



If you are using the src directory, use:



Terminal window

mkdir -p "src/app/api/auth/\[kindeAuth]"

touch "src/app/api/auth/\[kindeAuth]/route.ts"



Important

Our SDK relies on this file existing in this location specified above.



Open the newly created route.ts file, enter the following code, and save the file:



app/api/auth/\[kindeAuth]/route.ts

import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server"

export const GET = handleAuth()



This will handle Kinde Auth endpoints in your Next.js app.



Copy the environment variables from the Quick start page to the .env.local or .env file and save changes.



You can create an environment file using the command touch .env.local



Add middleware

Link to this section

Create a middleware route and add the following code:



Terminal window

touch middleware.ts



middleware.ts

import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";



export default withAuth(

&#x20; async function middleware(req) {

&#x20; },

&#x20; {

&#x20;   // Middleware still runs on all routes, but doesn't protect the home route

&#x20;   publicPaths: \["/"], // e.g. \["/api/public", "/blog", "/about"]

&#x20; }

);



export const config = {

&#x20; matcher: \[

&#x20;   '/((?!\_next|\[^?]\*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).\*)',

&#x20; ],

}



The middleware will protect all routes except the ones specified in the publicPaths array. It will also ignore Next.js internals and static files.



Learn more about middlewares in the Middleware sections.



Add KindeProvider (Optional)

Link to this section

The KindeProvider component is designed for client-side context. You don’t need to use it if you are using server-side components only. If you are deploying your application to edge environments like Cloudflare Workers, this might lead to SSR issues.



If you want to configure it for client-side context, follow the steps below:



Create an AuthProvider component in your app directory and add the following code:



Terminal window

touch app/AuthProvider.tsx



app/AuthProvider.tsx

"use client";

import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";



export const AuthProvider = ({children}) => {

&#x20; return <KindeProvider>{children}</KindeProvider>;

};



Wrap your RootLayout component with the AuthProvider:



app/layout.tsx

/\* other code... \*/

import { AuthProvider } from './AuthProvider';



export const metadata = {

&#x20; title: 'Kinde Auth',

&#x20; description: 'Kinde with Next.js App Router'

};



export default function RootLayout({

&#x20; children

}: {

&#x20; children: React.ReactNode;

}) {

&#x20; return (

&#x20;     <html lang="en">

&#x20;       <body>

&#x20;         <AuthProvider>

&#x20;           {/\* Your other app code here \*/}

&#x20;           <main>{children}</main>

&#x20;         </AuthProvider>

&#x20;       </body>

&#x20;     </html>

&#x20; );

}



This will give you access to the Kinde Auth data in your client components and will ensure that the tokens are refreshed when needed.



Add auth links

Link to this section

Add the register and login links to your pages:



import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"



export default function Home() {

&#x20; return (

&#x20;   <>

&#x20;     <LoginLink>Sign in</LoginLink>

&#x20;     <RegisterLink>Sign up</RegisterLink>

&#x20;   </>

&#x20; )

&#x20; }



Check authenticated state within the page component:



import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"



export default function Dashboard() {

&#x20; const { isAuthenticated } = getKindeServerSession()



&#x20; if (!isAuthenticated()) {

&#x20;   return <div>You are not authenticated</div>

&#x20; }



&#x20; return <div>Dashboard</div>

}



Display logged-in user info and logout link:



import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"



export default async function Profile() {



&#x20; const { isAuthenticated, getUser } = getKindeServerSession();

&#x20; const user = await getUser();



&#x20; if (!isAuthenticated()) {

&#x20;   return <div>You are not authenticated</div>

&#x20; }



&#x20; return (

&#x20;   <div>

&#x20;     Welcome,

&#x20;     {user?.given\_name},

&#x20;     {user?.family\_name},

&#x20;     {user?.email},

&#x20;     {user?.picture},

&#x20;     <LogoutLink>Log out</LogoutLink>

&#x20;   </div>

&#x20; )

}



Start the development server:



Terminal window

npm run dev



Open the browser and navigate to http://localhost:3000 to see the application.



Watch the video guide:



Play: Video

Customizing Kinde Auth API paths

Link to this section

The default path for the Kinde Auth API is /api/auth. If your Next.js application uses a custom base path for your API, you can override this setting by setting the following variable in your .env file:



Terminal window

KINDE\_AUTH\_API\_PATH="/my/custom/path"



You can also customize the Kinde Auth API sub-paths by setting the following variables in your .env file:



KINDE\_AUTH\_LOGIN\_ROUTE - defaults to login

KINDE\_AUTH\_LOGOUT\_ROUTE - defaults to logout

KINDE\_AUTH\_REGISTER\_ROUTE - defaults to register

KINDE\_AUTH\_CREATEORG\_ROUTE - defaults to create\_org

KINDE\_AUTH\_HEALTH\_ROUTE - defaults to health

KINDE\_AUTH\_SETUP\_ROUTE - defaults to setup

Example

Link to this section

Given the following .env file:



Terminal window

KINDE\_AUTH\_API\_PATH="/my/custom/path"

KINDE\_AUTH\_LOGIN\_ROUTE="app\_login"



The Kinde login route for your application will be /my/custom/path/app\_login.



About the middleware

Link to this section

Middleware is used to protect routes in your Next.js app, and is a requirement for a seamless authentication experience.



We provide a withAuth helper that will protect routes covered by the matcher. If the user is not authenticated then they are redirected to login and once they have logged in they will be redirected back to the protected page which they should now have access to.



We require this middleware to run on all routes beside Next.js internals and static files. The provided matcher will do this for you.



This means that by default, all routes will be protected. You must opt-out public routes - see opting routes out of middleware protection for more information.



Want to learn more about middleware? Check out the Next.js middleware docs.



Standard configuration

Link to this section

This is the standard middleware.ts file that will protect all routes in your Next.js application.



middleware.ts

import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";



export default function middleware(req) {

&#x20; return withAuth(req);

}



export const config = {

&#x20; matcher: \[

&#x20;   // Run on everything but Next internals and static files

&#x20;   '/((?!\_next|\[^?]\*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).\*)',

&#x20; ]

};



Route protection with a callback function

Link to this section

You can use the withAuth helper to pass your middleware as a callback function. The callback function has access to kindeAuth object via the req parameter, which exposes the token and user data.



Using the withAuth helper, you can add additional configuration options object to your middleware.



middleware.ts

import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";



export default withAuth(async function middleware(req) {

&#x20; console.log("look at me", req.kindeAuth);

});



export const config = {

&#x20; matcher: \[

&#x20;   '/((?!\_next|\[^?]\*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).\*)',

&#x20; ]

};



Opting public routes out of middleware protection

Link to this section

As the middleware matcher is set to protect all routes, you can opt routes out of middleware protection by adding them to the publicPaths array.



middleware.ts

import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";



export default withAuth(

&#x20; async function middleware(req) {

&#x20; },

&#x20; {

&#x20;   // Middleware still runs on all routes, but doesn't protect the blog route

&#x20;   publicPaths: \["/blog"],

&#x20; }

);



export const config = {

&#x20; matcher: \[

&#x20;   '/((?!\_next|\[^?]\*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).\*)',

&#x20; ],

}



Additional middleware options object

Link to this section

You can pass an additional configuration options object to the withAuth helper to configure the middleware functionality.



isReturnToCurrentPage:Boolean - redirect the user back to the page they were trying to access

loginPage:String - define the path of the login page (where the users are redirected to when not authenticated)

publicPaths:Array of strings - define the public paths

isAuthorized:Function - define the criteria for authorization

middleware.ts

import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";



export default withAuth(

&#x20; async function middleware(req) {

&#x20;   console.log("look at me", req.kindeAuth);

&#x20; },

&#x20; {

&#x20;   isReturnToCurrentPage: true,

&#x20;   loginPage: "/login",

&#x20;   publicPaths: \["/public", '/more'],

&#x20;   isAuthorized: ({token}) => {

&#x20;     // The user will be considered authorized if they have the permission 'eat:chips'

&#x20;     return token.permissions.includes("eat:chips");

&#x20;   }

&#x20; }

);



export const config = {

&#x20; matcher: \[

&#x20;   '/((?!\_next|\[^?]\*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).\*)',

&#x20; ],

}



Authentication

Link to this section

Sign up and sign in

Link to this section

The SDK ships with <LoginLink> and <RegisterLink> components which can be used to start the auth flow.



import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";



...



<LoginLink>Sign in</LoginLink>

<RegisterLink>Sign up</RegisterLink>



Redirecting after authentication

Link to this section

Static redirect



If you want to redirect users to a certain page after logging in, you can set the KINDE\_POST\_LOGIN\_REDIRECT\_URL environment variable in your .env.local file.



Dynamic redirect



You can also set a postLoginRedirectURL parameter to tell us where to redirect after authenticating.



import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";



...



<LoginLink postLoginRedirectURL="/dashboard">Sign in</LoginLink>

<RegisterLink postLoginRedirectURL="/welcome">Sign up</RegisterLink>



This appends post\_login\_redirect\_url to the search params when redirecting to Kinde Auth. You can achieve the same result as above, like this:



import { redirect } from "next/navigation";

...



redirect('/api/auth/login?post\_login\_redirect\_url=/dashboard')



...



Logout

Link to this section

This is implemented in much the same way as signing up or signing in. A component is provided for you.



import {LogoutLink} from "@kinde-oss/kinde-auth-nextjs/components";



...



<LogoutLink>Log out</LogoutLink>



Kinde Auth data - Server

Link to this section

You can get an authorized user’s Kinde Auth data from any server component using the getKindeServerSession helper.



Method	Description

isAuthenticated	Check if the user is authenticated

getUser	Get the current user’s details

getOrganization	Get the current user’s organization

getUserOrganizations	Get all the organizations the current user belongs to

getPermission	Check if the current user has a permission

getPermissions	Get the current user’s permissions

getFlag	Get a feature flag

getBooleanFlag	Get a boolean feature flag

getIntegerFlag	Get an integer feature flag

getStringFlag	Get a string feature flag

getAccessToken	Get the decoded access token

getAccessTokenRaw	Get the access token

getIdToken	Get the decoded ID token

getIdTokenRaw	Get the ID token

getClaim	Get a claim from either token

isAuthenticated

Link to this section

Check if the user is authenticated.



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {isAuthenticated} = getKindeServerSession();

const isUserAuthenticated = await isAuthenticated();



Returns

Link to this section

true;



getUser

Link to this section

Get the logged in user’s details.



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getUser} = getKindeServerSession();

const user = await getUser();



console.log(user);



Returns

Link to this section

{

&#x20; "id": "kp\_123",

&#x20; "email": "example@email.com",

&#x20; "family\_name": "Example",

&#x20; "given\_name": "User",

&#x20; "picture": null,

&#x20; "username": "ExampleUsername",

&#x20; "phone\_number": "1234567890",

&#x20; "properties": {

&#x20;   "usr\_city": "",

&#x20;   "usr\_industry": "",

&#x20;   "usr\_job\_title": "",

&#x20;   "usr\_middle\_name": "",

&#x20;   "usr\_postcode": "",

&#x20;   "usr\_salutation": "",

&#x20;   "usr\_state\_region": "",

&#x20;   "usr\_street\_address": "",

&#x20;   "usr\_street\_address\_2": ""

&#x20; }

}



getOrganization

Link to this section

Get the current user’s organization



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getOrganization} = getKindeServerSession();

const org = await getOrganization();



console.log(org);



Returns

Link to this section

{

&#x20; "orgCode": "org\_123",

&#x20; "orgName": "Default Org",

&#x20; "properties": {

&#x20;   "org\_city": "",

&#x20;   "org\_country": "",

&#x20;   "org\_industry": "",

&#x20;   "org\_postcode": "",

&#x20;   "org\_state\_region": "",

&#x20;   "org\_street\_address": "",

&#x20;   "org\_street\_address\_2": ""

&#x20; }

}



getUserOrganizations

Link to this section

Get all the organizations the current user belongs to



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getUserOrganizations} = getKindeServerSession();

const userOrgs = await getUserOrganizations();



console.log(userOrgs);



Returns

Link to this section

{

&#x20; "orgCodes": \["org\_123", "org\_456"],

&#x20; "orgs": \[

&#x20;   {

&#x20;     "code": "org\_123",

&#x20;     "name": "Default Org"

&#x20;   },

&#x20;   {

&#x20;     "code": "org\_456",

&#x20;     "name": "Another Org"

&#x20;   }

&#x20; ]

}



getPermission

Link to this section

Check if the current user has a permission.



Parameter	Type	Description

code	string	The permission code to check

Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getPermission} = getKindeServerSession();

const canEatTacos = await getPermission("eat:tacos");



console.log(canEatTacos);



Returns

Link to this section

{

&#x20; "isGranted": true,

&#x20; "orgCode": "org\_123"

}



getPermissions

Link to this section

Get the current user’s permissions.



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getPermissions} = getKindeServerSession();

const permissions = await getPermissions();



console.log(permissions);



Returns

Link to this section

{

&#x20; "permissions": \["eat:tacos", "read:books"],

&#x20; "orgCode": "org\_123"

}



getFlag

Link to this section

Get a feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	boolean | string | number	The default value to return if the flag is not set

type	enum (b | s | i)	The type of the flag

Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getFlag} = getKindeServerSession();

const billingFlag = await getFlag("billing", false, "b");



console.log(billingFlag);



Returns

Link to this section

{

&#x20; "code": "billing",

&#x20; "type": "boolean",

&#x20; "value": true,

&#x20; "defaultValue": false,

&#x20; "is\_default": false

}



getBooleanFlag

Link to this section

Get a boolean feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	boolean	The default value to return if the flag is not set

Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getBooleanFlag} = getKindeServerSession();

const billingFlag = await getBooleanFlag("billing", false);



console.log(billingFlag);



Returns

Link to this section

true;



getIntegerFlag

Link to this section

Get an integer feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	number	The default value to return if the flag is not set

Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getIntegerFlag} = getKindeServerSession();

const billingVersion = await getIntegerFlag("billingVersion", 0);



console.log(billingVersion);



Returns

Link to this section

2



getStringFlag

Link to this section

Get a string feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	string	The default value to return if the flag is not set

Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getStringFlag} = getKindeServerSession();

const theme = await getStringFlag("theme", "system");



console.log(theme);



Returns

Link to this section

"light"



refreshTokens

Link to this section

Refresh tokens to get up-to-date Kinde data



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";

import {someUpdateFunction} from "@/app/actions";



const {refreshTokens} = getKindeServerSession();

await someUpdateFunction({

&#x20; param\_1: "value\_1",

&#x20; param\_2: "value\_2"

});

await refreshTokens();



getAccessToken

Link to this section

Get the decoded access token



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getAccessToken} = getKindeServerSession();

const accessToken = await getAccessToken();



console.log(accessToken);



Returns

Link to this section

{

&#x20; "aud": \["your-api"],

&#x20; "azp": 1234567890,

&#x20; "email": "example@email.com",

&#x20; "exp": 1234567890,

&#x20; "feature\_flags": {

&#x20;   "isonboardingcomplete": {

&#x20;     "t": "b",

&#x20;     "v": false

&#x20;   }

&#x20; },

&#x20; "iat": 1234567890,

&#x20; "iss": "https://your-kinde-subdomain.kinde.com",

&#x20; "jti": "7802e2d2-asdf-431e-bc72-5ed95asdf475d",

&#x20; "org\_code": "org\_123",

&#x20; "org\_name": "Default Org",

&#x20; "organization\_properties": {

&#x20;   "kp\_org\_city": {}

&#x20; },

&#x20; "permissions": \["create:template"],

&#x20; "roles": \[

&#x20;   {

&#x20;     "id": "018ee9aa-f92b-83fc-1d40-1234567890",

&#x20;     "key": "admin",

&#x20;     "name": "Admin"

&#x20;   }

&#x20; ],

&#x20; "scp": \["openid", "profile", "email", "offline"],

&#x20; "sub": "kp\_6123456789009876",

&#x20; "user\_properties": {

&#x20;   "kp\_usr\_city": {}

&#x20; }

}



getAccessTokenRaw

Link to this section

Get the access token



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getAccessTokenRaw} = getKindeServerSession();

const accessToken = await getAccessTokenRaw();



console.log(accessToken);



Returns

Link to this section

eyJhxxx.eyJhdxxx.A4djjxxx



getIdToken

Link to this section

Get the decoded ID token



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getIdToken} = getKindeServerSession();

const idToken = await getIdToken();



console.log(idToken);



Returns

Link to this section

{

&#x20; "at\_hash": "ZY6jx1SGjzgkHGJ\_2Jabcd",

&#x20; "aud": \["feb8e697b967466eacb96d26c5ca0e12"],

&#x20; "auth\_time": 1234567890,

&#x20; "azp": "feb8e099xxx",

&#x20; "email": "example@email.com",

&#x20; "email\_verified": true,

&#x20; "exp": 123456789,

&#x20; "ext\_provider": {

&#x20;   "claims": {

&#x20;     "connection\_id": "bcc486xxx",

&#x20;     "email": "example@email.com",

&#x20;     "family\_name": "User",

&#x20;     "given\_name": "Example",

&#x20;     "is\_confirmed": true,

&#x20;     "picture": "https://lh3.googleusercontent.com/a/ACgxxx",

&#x20;     "profile": {

&#x20;       "email": "example@email.com",

&#x20;       "family\_name": "User",

&#x20;       "given\_name": "Example",

&#x20;       "id": "1234567890",

&#x20;       "name": "Example user",

&#x20;       "picture": "https://lh3.googleusercontent.com/a/ACgxxx",

&#x20;       "verified\_email": true

&#x20;     }

&#x20;   },

&#x20;   "connection\_id": "bccxxx",

&#x20;   "name": "Google"

&#x20; },

&#x20; "family\_name": "User",

&#x20; "given\_name": "Example",

&#x20; "iat": 1234567890,

&#x20; "iss": "https://your-kinde-subdomain.kinde.com",

&#x20; "jti": "e7e18303-0ea5-402d-932c-xxx",

&#x20; "name": "Example user",

&#x20; "org\_codes": \["org\_123"],

&#x20; "organizations": \[

&#x20;   {

&#x20;     "id": "org\_123",

&#x20;     "name": "Default Organization"

&#x20;   }

&#x20; ],

&#x20; "picture": "https://lh3.googleusercontent.com/a/ACgxxx",

&#x20; "rat": 1234567890,

&#x20; "sub": "kp\_1234567890",

&#x20; "updated\_at": 1234567890,

&#x20; "user\_properties": {

&#x20;   "kp\_usr\_city": {}

&#x20; }

}



getIdTokenRaw

Link to this section

Get the ID token



Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getIdTokenRaw} = getKindeServerSession();

const idToken = await getIdTokenRaw();



console.log(idToken);



Returns

Link to this section

eyJhxxx.eyJhdxxx.A4djjxxx



getClaim

Link to this section

Get a claim from either token



Parameter	Type	Description

claim	string	The claim key

type	enum (access\_token | id\_token)	The token to get the claim from

Example

Link to this section

import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";



const {getClaim} = getKindeServerSession();

const username = await getClaim("preferred\_username", "id\_token");



console.log(idToken);



Returns

Link to this section

"exampleUsername"



Kinde Auth data - Client

Link to this section

You can get an authorized user’s Kinde Auth data from any client component using the useKindeBrowserClient helper.



Variable / Method	Description

isAuthenticated	Check if the user is authenticated

user / getUser	The current user’s details

organization / getOrganization	The current user’s organization

userOrganizations / getUserOrganizations	All the organizations the current user belongs to

getPermission	Check if the current user has a permission

permissions / getPermissions	The current user’s permissions

getFlag	Get a feature flag

getBooleanFlag	Get a boolean feature flag

getIntegerFlag	Get an integer feature flag

getStringFlag	Get a string feature flag

refreshData	Refresh tokens to get up-to-date Kinde data

accessToken / getAccessToken	Get the decoded access token

accessTokenRaw / getAccessTokenRaw	Get the access token

idToken / getIdToken	Get the decoded ID token

idTokenRaw / getIdTokenRaw	Get the ID token

isLoading	Is Kinde data loading

error	Error message if there is an error

Tip: Use isLoading to ensure the data is up to date. You can return a loading spinner or something similar if you want.



isAuthenticated

Link to this section

Check if the user is authenticated.



Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {isAuthenticated} = useKindeBrowserClient();

console.log(isAuthenticated);



Returns

Link to this section

true;



user / getUser

Link to this section

Get the logged in user’s details.



Example

Link to this section

"use client";



import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {user, getUser} = useKindeBrowserClient();

const alsoUser = getUser();



console.log(user);



Returns

Link to this section

{

&#x20; "id": "kp\_123",

&#x20; "email": "example@email.com",

&#x20; "family\_name": "Example",

&#x20; "given\_name": "User",

&#x20; "picture": null,

&#x20; "username": "ExampleUsername",

&#x20; "phone\_number": "1234567890",

&#x20; "properties": {

&#x20;   "usr\_city": "",

&#x20;   "usr\_industry": "",

&#x20;   "usr\_job\_title": "",

&#x20;   "usr\_middle\_name": "",

&#x20;   "usr\_postcode": "",

&#x20;   "usr\_salutation": "",

&#x20;   "usr\_state\_region": "",

&#x20;   "usr\_street\_address": "",

&#x20;   "usr\_street\_address\_2": ""

&#x20; }

}



organization / getOrganization

Link to this section

Get the current user’s organization



Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {organization, getOrganization} = useKindeBrowserClient();

const org = getOrganization();



console.log(organization, org);



Returns

Link to this section

{

&#x20; "orgCode": "org\_123",

&#x20; "orgName": "Default Org",

&#x20; "properties": {

&#x20;   "org\_city": "",

&#x20;   "org\_country": "",

&#x20;   "org\_industry": "",

&#x20;   "org\_postcode": "",

&#x20;   "org\_state\_region": "",

&#x20;   "org\_street\_address": "",

&#x20;   "org\_street\_address\_2": ""

&#x20; }

}



userOrganizations / getUserOrganizations

Link to this section

Get all the organizations the current user belongs to



Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {userOrganizations, getUserOrganizations} = useKindeBrowserClient();

const userOrgs = getUserOrganizations();



console.log(userOrganizations, userOrgs);



Returns

Link to this section

{

&#x20; "orgCodes": \["org\_123", "org\_456"],

&#x20; "orgs": \[

&#x20;   {

&#x20;     "code": "org\_123",

&#x20;     "name": "Default Org"

&#x20;   },

&#x20;   {

&#x20;     "code": "org\_456",

&#x20;     "name": "Another Org"

&#x20;   }

&#x20; ]

}



getPermission

Link to this section

Check if the current user has a permission.



Parameter	Type	Description

code	string	The permission code to check

Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {getPermission} = useKindeBrowserClient();

const canEatTacos = getPermission("eat:tacos");



console.log(canEatTacos);



Returns

Link to this section

{

&#x20; "isGranted": true,

&#x20; "orgCode": "org\_123"

}



permissions / getPermissions

Link to this section

Get the current user’s permissions.



Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {permissions, getPermissions} = useKindeBrowserClient();

const perms = getPermissions();



console.log(permissions, perms);



Returns

Link to this section

{

&#x20; "permissions": \["eat:tacos", "read:books"],

&#x20; "orgCode": "org\_123"

}



getFlag

Link to this section

Get a feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	boolean | string | number	The default value to return if the flag is not set

type	enum (b | s | i)	The type of the flag

Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {getFlag} = useKindeBrowserClient();

const billingFlag = getFlag("billing", false, "b");



console.log(billingFlag);



Returns

Link to this section

{

&#x20; "code": "billing",

&#x20; "type": "boolean",

&#x20; "value": true,

&#x20; "defaultValue": false,

&#x20; "is\_default": false

}



getBooleanFlag

Link to this section

Get a boolean feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	boolean	The default value to return if the flag is not set

Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {getBooleanFlag} = useKindeBrowserClient();

const billingFlag = getBooleanFlag("billing", false);



console.log(billingFlag);



Returns

Link to this section

true;



getIntegerFlag

Link to this section

Get an integer feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	number	The default value to return if the flag is not set

Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {getIntegerFlag} = useKindeBrowserClient();

const billingVersion = getIntegerFlag("billingVersion", 0);



console.log(billingVersion);



Returns

Link to this section

2



getStringFlag

Link to this section

Get a string feature flag



Parameter	Type	Description

code	string	The flag code to check

defaultValue	string	The default value to return if the flag is not set

Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {getStringFlag} = useKindeBrowserClient();

const theme = getStringFlag("theme", "system");



console.log(theme);



Returns

Link to this section

"light"



refreshData

Link to this section

Refresh tokens to get up-to-date Kinde data



Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";

import {someUpdateFunction} from "@/app/actions";



const {refreshData} = useKindeBrowserClient();



await someUpdateFunction({

&#x20; param\_1: "value\_1",

&#x20; param\_2: "value\_2"

});

await refreshData();



accessToken / getAccessToken

Link to this section

Get the decoded access token



Example

Link to this section

"use client";

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {accessToken, getAccessToken} = useKindeBrowserClient();

const aTok = getAccessToken();



console.log(accessToken, aTok);



Returns

Link to this section

{

&#x20; "aud": \["your-api"],

&#x20; "azp": 1234567890,

&#x20; "email": "example@email.com",

&#x20; "exp": 1234567890,

&#x20; "feature\_flags": {

&#x20;   "isonboardingcomplete": {

&#x20;     "t": "b",

&#x20;     "v": false

&#x20;   }

&#x20; },

&#x20; "iat": 1234567890,

&#x20; "iss": "https://your-kinde-subdomain.kinde.com",

&#x20; "jti": "7802e2d2-asdf-431e-bc72-5ed95asdf475d",

&#x20; "org\_code": "org\_123",

&#x20; "org\_name": "Default Org",

&#x20; "organization\_properties": {

&#x20;   "kp\_org\_city": {}

&#x20; },

&#x20; "permissions": \["create:template"],

&#x20; "roles": \[

&#x20;   {

&#x20;     "id": "018ee9aa-f92b-83fc-1d40-1234567890",

&#x20;     "key": "admin",

&#x20;     "name": "Admin"

&#x20;   }

&#x20; ],

&#x20; "scp": \["openid", "profile", "email", "offline"],

&#x20; "sub": "kp\_6123456789009876",

&#x20; "user\_properties": {

&#x20;   "kp\_usr\_city": {}

&#x20; }

}



accessTokenRaw / getAccessTokenRaw

Link to this section

Get the access token



Example

Link to this section

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {accessTokenRaw, getAccessTokenRaw} = useKindeBrowserClient();

const aTokRaw = getAccessTokenRaw();



console.log(accessTokenRaw, aTokRaw);



Returns

Link to this section

eyJhxxx.eyJhdxxx.A4djjxxx



idToken / getIdToken

Link to this section

Get the decoded ID token



Example

Link to this section

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {idToken, getIdToken} = useKindeBrowserClient();

const idTok = getIdToken();



console.log(idToken, idTok);



Returns

Link to this section

{

&#x20; "at\_hash": "ZY6jx1SGjzgkHGJ\_2Jabcd",

&#x20; "aud": \["feb8e697b967466eacb96d26c5ca0e12"],

&#x20; "auth\_time": 1234567890,

&#x20; "azp": "feb8e099xxx",

&#x20; "email": "example@email.com",

&#x20; "email\_verified": true,

&#x20; "exp": 123456789,

&#x20; "ext\_provider": {

&#x20;   "claims": {

&#x20;     "connection\_id": "bcc486xxx",

&#x20;     "email": "example@email.com",

&#x20;     "family\_name": "User",

&#x20;     "given\_name": "Example",

&#x20;     "is\_confirmed": true,

&#x20;     "picture": "https://lh3.googleusercontent.com/a/ACgxxx",

&#x20;     "profile": {

&#x20;       "email": "example@email.com",

&#x20;       "family\_name": "User",

&#x20;       "given\_name": "Example",

&#x20;       "id": "1234567890",

&#x20;       "name": "Example user",

&#x20;       "picture": "https://lh3.googleusercontent.com/a/ACgxxx",

&#x20;       "verified\_email": true

&#x20;     }

&#x20;   },

&#x20;   "connection\_id": "bccxxx",

&#x20;   "name": "Google"

&#x20; },

&#x20; "family\_name": "User",

&#x20; "given\_name": "Example",

&#x20; "iat": 1234567890,

&#x20; "iss": "https://your-kinde-subdomain.kinde.com",

&#x20; "jti": "e7e18303-0ea5-402d-932c-xxx",

&#x20; "name": "Example user",

&#x20; "org\_codes": \["org\_123"],

&#x20; "organizations": \[

&#x20;   {

&#x20;     "id": "org\_123",

&#x20;     "name": "Default Organization"

&#x20;   }

&#x20; ],

&#x20; "picture": "https://lh3.googleusercontent.com/a/ACgxxx",

&#x20; "rat": 1234567890,

&#x20; "sub": "kp\_1234567890",

&#x20; "updated\_at": 1234567890,

&#x20; "user\_properties": {

&#x20;   "kp\_usr\_city": {}

&#x20; }

}



idTokenRaw / getIdTokenRaw

Link to this section

Get the ID token



Example

Link to this section

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {idTokenRaw, getIdTokenRaw} = useKindeBrowserClient();

const idTokRaw = getIdTokenRaw();



console.log(idTokenRaw, idTokRaw);



Returns

Link to this section

eyJhxxx.eyJhdxxx.A4djjxxx



isLoading

Link to this section

Is Kinde data loading



Example

Link to this section

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {user, isLoading} = useKindeBrowserClient();



if (isLoading) return <div>Loading...</div>;



return <div>Hello {user.given\_name}</div>;



Returns

Link to this section

true



error

Link to this section

Error message if there is an error



Example

Link to this section

import {useKindeBrowserClient} from "@kinde-oss/kinde-auth-nextjs";



const {user, isLoading, error} = useKindeBrowserClient();



if (isLoading) return <div>Loading...</div>;



if (error) return <div>There was an error</div>;



return <div>Hello {user.given\_name}</div>;



Returns

Link to this section

true



Protecting routes

Link to this section

It’s likely that your application will have both pages that are publicly available and private ones which should only be available to logged in users. There are multiple ways you can protect pages with Kinde Auth.



Protect routes with Kinde Auth data

Link to this section

On the page you want to protect, you can check if the user is authenticated and then handle it right then and there by grabbing the Kinde Auth data.



In Server Components you can get the Kinde Auth data by using the getKindeServerSession helper

In Client Components you can get the Kinde Auth Data using the useKindeBrowserClient helper

// app/protected/page.tsx - Server Component



import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";



export default async function Protected() {

&#x20; const { isAuthenticated } = getKindeServerSession();



&#x20; return (await isAuthenticated()) ? (

&#x20;   <div>

&#x20;     This page is protected - but you can view it because you are authenticated

&#x20;   </div>

&#x20; ) : (

&#x20;   <div>

&#x20;     This page is protected, please <LoginLink>Login</LoginLink> to view it

&#x20;   </div>

&#x20; );

}



// app/protected/page.tsx - Client component

"use client";



import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";



export default function Admin() {

&#x20; const { isAuthenticated, isLoading } = useKindeBrowserClient();



&#x20; if (isLoading) return <div>Loading...</div>;



&#x20; return isAuthenticated ? (

&#x20;   <div>Admin content</div>

&#x20; ) : (

&#x20;   <div>

&#x20;     You have to <LoginLink>Login</LoginLink> to see this page

&#x20;   </div>

&#x20; );

}



In the example above, we show different content based on whether or not the user is authenticated. If you want to automatically send the user to the sign in screen, you can do something like the following:



// app/protected/page.tsx - Server Component



import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";

import {redirect} from "next/navigation";



export default async function Protected() {

&#x20; const {isAuthenticated} = getKindeServerSession();



&#x20; if (!(await isAuthenticated())) {

&#x20;   redirect("/api/auth/login");

&#x20; }



&#x20; return <div>Protected content</div>;

}



// app/protected/page.tsx - Client Component



// As of right now, this can't be done in Client Components because of how Next.js handles

// navigation in client components with prefetching and caching.

// But you can still achieve an automatic redirect with middleware



If you want the user to be redirected back to that route after signing in, you can set post\_login\_redirect\_url in the search params of the redirect.



if (!(await isAuthenticated())) {

&#x20; redirect("/api/auth/login?post\_login\_redirect\_url=/protected");

}



Refreshing Kinde data

Link to this section

Our middleware will automatically refresh the tokens in your session in the background.



Sometimes, you may want to refresh these tokens on demand. An example of this is when you update Kinde data via the UI or with the Management API.



To immediately get the most up-to-date Kinde data in your session, use the refreshData function provided by useKindeBrowserClient.



Warning

This utility only works in Next.js 14 and above. Attempting to use it in an older version will result in a warning.



Due to limitations in Next.js, refreshing data on demand can only occur from a client component.



For more information, see the Next.js docs.



Important

The refreshData function is an asynchronous server action, and it’s important to await it so that you receive immediate access to the latest data.



"use client";



import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";



export const UpdatePermissionsButton = () => {

&#x20;   const { refreshData, getPermissions } = useKindeBrowserClient();



&#x20;   const handleUpdatePermissions = async () => {

&#x20;       // For example purposes, let's say you have an API route that updates the permissions for a user

&#x20;       await fetch("/api/user/permissions");



&#x20;       // Then you can refresh the data and have the changes reflected immediately

&#x20;       await refreshData();



&#x20;       const newPermissions = getPermissions();



&#x20;       // Do something with the new permissions

&#x20;       // ...

&#x20;   }



&#x20;   return (

&#x20;       <button

&#x20;           type="button"

&#x20;           onClick={handleUpdatePermissions}

&#x20;       >

&#x20;           Update Permissions

&#x20;       </button>

&#x20;   );

};



Kinde Management API

Link to this section

To use our management API please see @kinde/management-api-js



Server Component example:



import { Roles, Users } from "@kinde/management-api-js";



export default async function Dashboard() {

&#x20; const { roles } = await Roles.getRoles();

&#x20; const { users } = await Users.getUsers();



&#x20; return (

&#x20;   <div className="container">

&#x20;     <div className="card start-hero">

&#x20;       <p className="text-body-2 start-hero-intro">Woohoo!</p>

&#x20;       <p className="text-display-2">

&#x20;         Your authentication is all sorted.

&#x20;         <br />

&#x20;         Build the important stuff.

&#x20;       </p>

&#x20;     </div>

&#x20;     <section className="next-steps-section">

&#x20;       <h2 className="text-heading-1">Next steps for you</h2>

&#x20;     </section>



&#x20;     <pre>{JSON.stringify(users, null, 2)}</pre>

&#x20;   </div>

&#x20; );

}



Route Handler example:



import {NextResponse} from "next/server";

import {Users} from "@kinde/management-api-js";



export async function GET() {

&#x20; const {users} = await Users.getUsers();



&#x20; return NextResponse.json({users});

}



Organizations

Link to this section

Create organizations

Link to this section

To create an organization from your app, you can use the CreateOrgLink component.



import {CreateOrgLink} from "@kinde-oss/kinde-auth-nextjs/components";



<CreateOrgLink orgName="Hurlstone">Create org</CreateOrgLink>;



Sign in to organizations

Link to this section

You can have your users sign in to a specific organization by setting the orgCode param in the LoginLink and RegisterLink components.



import {LoginLink, RegisterLink} from "@kinde-oss/kinde-auth-nextjs/components";



<LoginLink orgCode="org\_7392cf35a1e">Login</LoginLink>

<RegisterLink orgCode="org\_7392cf35a1e">Register</RegisterLink>



If the orgCode is not specified and the user belongs to multiple organizations, they will be prompted to choose which organization to sign in to during the login or register flow.



Self Serve Portal

Link to this section

To allow your users to be sent to the self-serve portal, you can use the PortalLink component. Check here for information on enabling self-serve portal for Organizations. Check here for information on enabling self-serve portal for users. To use our self-serve portal API please see Get self-serve portal link.



import {PortalLink} from "@kinde-oss/kinde-auth-nextjs/components";



<PortalLink>Portal Link Name</PortalLink>



subNav

Link to this section

The subNav="" property allows you to set the area of the portal you want the user to land on. By default, it will send users to their profile.



import {PortalLink} from "@kinde-oss/kinde-auth-nextjs/components";

import { PortalPage } from "@kinde/js-utils";



<PortalLink subNav={PortalPage.organizationPaymentDetails}></PortalLink>



returnUrl

Link to this section

The returnUrl property is the URL to redirect the user to after they have completed their actions in the portal. The url must be an absolute url to work correctly.



import {PortalLink} from "@kinde-oss/kinde-auth-nextjs/components";



<PortalLink returnUrl="http://yourdomain.example"></PortalLink>



UTM tags for analytics

Link to this section

UTM tags can be used with the LoginLink and RegisterLink components to track auth traffic from its origin. You can then track the tags on the Analytics dashboard from within the Kinde app.



import {LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";



<LoginLink

&#x20; authUrlParams={{

&#x20;   utm\_source: "reddit",

&#x20;   utm\_medium: "social",

&#x20;   utm\_campaign: "redjune23",

&#x20;   utm\_term: "save90",

&#x20;   utm\_content: "desktop"

&#x20; }}

>

&#x20; Login

</LoginLink>;



Internationalization

Link to this section

You can set the language you wish your users to see when they hit the login flow by including the lang attribute as a part of the authUrlParams when using the LoginLink and RegisterLink components.



import {LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";



<LoginLink

&#x20; authUrlParams={{

&#x20;   lang: "en-AU"

&#x20; }}

>

&#x20; Login

</LoginLink>;



Audience

Link to this section

An audience is the intended recipient of an access token - for example the API for your application. The audience argument can be passed to the Kinde client to request an audience be added to the provided token.



.env.local

...

KINDE\_AUDIENCE=<your-api>



You can request multiple audiences by providing a white space separated list



.env.local

...

KINDE\_AUDIENCE=<your-api-1> <your-api-2>



For details on how to connect, see Register an API.



Working with subdomains

Link to this section

In the case you have a custom domain and you would like to start the authentication flow from a URL like auth.mysite.com and you want to redirect to a URL like app.mysite.com , all you have to do is set the KINDE\_COOKIE\_DOMAIN to match the domain.



.env

...

KINDE\_COOKIE\_DOMAIN=.mysite.com



If the URL you want to start the authentication flow from and the URL you want to redirect to don’t share the same domain, then this will not work.



Working with preview URLs

Link to this section

Our Kinde Next.js SDK currently requires that these environment variables KINDE\_SITE\_URL, KINDE\_POST\_LOGOUT\_REDIRECT\_URL, and KINDE\_POST\_LOGIN\_REDIRECT\_URL are defined, and that the callback URLs and logout redirect URLs are added to your app in Kinde.



To add Vercel’s dynamically generated URLs you can either securely use our API to add them on the fly or you can use wildcard URLs. It should be noted that whilst wildcards are more convenient it is not as secure as explicitly adding the url to the allowlist via API as we outline below.



Add the following to your next.config.js.



/\*\* @type {import('next').NextConfig} \*/

const nextConfig = {

&#x20; env: {

&#x20;   KINDE\_SITE\_URL: process.env.KINDE\_SITE\_URL ?? `https://${process.env.VERCEL\_URL}`,

&#x20;   KINDE\_POST\_LOGOUT\_REDIRECT\_URL:

&#x20;     process.env.KINDE\_POST\_LOGOUT\_REDIRECT\_URL ?? `https://${process.env.VERCEL\_URL}`,

&#x20;   KINDE\_POST\_LOGIN\_REDIRECT\_URL:

&#x20;     process.env.KINDE\_POST\_LOGIN\_REDIRECT\_URL ?? `https://${process.env.VERCEL\_URL}/dashboard`

&#x20; }

};



module.exports = nextConfig;



This ensures Vercel uses its generated preview URLs to populate the three Kinde variables.



Make sure the above values match your application (e.g. “/dashboard” for KINDE\_POST\_LOGIN\_REDIRECT\_URL)

Also make sure variables are not set for the preview environment in your Vercel project. If they are, they will be overridden by the new variables in the next.config.js file.

Add callback URLs and logout redirect URLs to Kinde dynamically

Link to this section

Create a script that will run each time a new preview is deployed by Vercel, which will add the newly generated URL to Kinde.



You need to create a machine to machine (M2M) application to connect to the Kinde Management API.



Create a Machine to machine (M2M) app.



In Kinde, go to Settings > Applications and click on Add application.

Give your application a name and select Machine to machine (M2M).

Select Save.

On the next screen, take note of the Client ID and Client secret values and add them to your .env.local file as KINDE\_M2M\_CLIENT\_ID and KINDE\_M2M\_CLIENT\_SECRET.

On the same screen, click on APIs on the left menu.

Authorize your M2M application to access the Kinde Management API by selecting the three dots (...) and clicking Authorize application.

Once the application is authorized, select the three dots (...) again and this time select Manage scopes.

Since we will be adding callback and redirect URLs dynamically via the Kinde Management API, you will need to toggle the switch for create:application\_redirect\_uris and create:application\_logout\_uris.

Select Save.

In your application source code, create a folder at the top level called scripts.



Within that folder, create a file called add-urls-to-kinde.js and add the following code:



async function getAuthToken() {

&#x20; try {

&#x20;   const response = await fetch(`${process.env.KINDE\_ISSUER\_URL}/oauth2/token`, {

&#x20;     method: "POST",

&#x20;     headers: {

&#x20;       "Content-Type": "application/x-www-form-urlencoded",

&#x20;       Accept: "application/json"

&#x20;     },

&#x20;     body: new URLSearchParams({

&#x20;       client\_id: process.env.KINDE\_M2M\_CLIENT\_ID,

&#x20;       client\_secret: process.env.KINDE\_M2M\_CLIENT\_SECRET,

&#x20;       grant\_type: "client\_credentials",

&#x20;       audience: `${process.env.KINDE\_ISSUER\_URL}/api`

&#x20;     })

&#x20;   });



&#x20;   if (!response.ok) {

&#x20;     throw new Error(`Failed to get auth token: ${response.statusText}`);

&#x20;   }



&#x20;   const data = await response.json();

&#x20;   return data.access\_token;

&#x20; } catch (error) {

&#x20;   console.error("Error getting auth token:", error);

&#x20;   throw error;

&#x20; }

}



async function addLogoutUrlToKinde(token) {

&#x20; try {

&#x20;   const response = await fetch(

&#x20;     `${process.env.KINDE\_ISSUER\_URL}/api/v1/applications/${process.env.KINDE\_CLIENT\_ID}/auth\_logout\_urls`,

&#x20;     {

&#x20;       method: "POST",

&#x20;       headers: {

&#x20;         Authorization: `Bearer ${token}`,

&#x20;         Accept: "application/json",

&#x20;         "Content-Type": "application/json"

&#x20;       },

&#x20;       body: JSON.stringify({

&#x20;         urls: \[`https://${process.env.VERCEL\_URL}`]

&#x20;       })

&#x20;     }

&#x20;   );



&#x20;   if (!response.ok) {

&#x20;     throw new Error(`Failed to add logout URL to Kinde: ${response.statusText}`);

&#x20;   }



&#x20;   const responseData = await response.json();

&#x20;   console.log(`SUCCESS: Logout URL added to Kinde: ${process.env.VERCEL\_URL}`, responseData);

&#x20; } catch (error) {

&#x20;   console.error("Failed to add logout URL to Kinde", error);

&#x20;   throw error;

&#x20; }

}



async function addCallbackUrlToKinde(token) {

&#x20; try {

&#x20;   const response = await fetch(

&#x20;     `${process.env.KINDE\_ISSUER\_URL}/api/v1/applications/${process.env.KINDE\_CLIENT\_ID}/auth\_redirect\_urls`,

&#x20;     {

&#x20;       method: "POST",

&#x20;       headers: {

&#x20;         Authorization: `Bearer ${token}`,

&#x20;         Accept: "application/json",

&#x20;         "Content-Type": "application/json"

&#x20;       },

&#x20;       body: JSON.stringify({

&#x20;         urls: \[`https://${process.env.VERCEL\_URL}/api/auth/kinde\_callback`]

&#x20;       })

&#x20;     }

&#x20;   );



&#x20;   if (!response.ok) {

&#x20;     throw new Error(`Failed to add callback URL to Kinde: ${response.statusText}`);

&#x20;   }



&#x20;   const responseData = await response.json();

&#x20;   console.log(

&#x20;     `SUCCESS: Callback URL added to Kinde: ${process.env.VERCEL\_URL}/api/auth/kinde\_callback`,

&#x20;     responseData

&#x20;   );

&#x20; } catch (error) {

&#x20;   console.error("Failed to add callback URL to Kinde", error);

&#x20;   throw error;

&#x20; }

}



(async () => {

&#x20; if (process.env.VERCEL === "1") {

&#x20;   try {

&#x20;     const authToken = await getAuthToken();

&#x20;     await addCallbackUrlToKinde(authToken);

&#x20;     await addLogoutUrlToKinde(authToken);

&#x20;   } catch (error) {

&#x20;     console.error("Script failed:", error);

&#x20;   }

&#x20; }

})();



You can adapt the script above to use our Kinde Management API JS package. Please note that in this case you would have to add this package as a dependency in your project along with a few required environment variables. See configuration details.



In your package.json, add a postbuild script that will run the /scripts/add-urls-to-kinde.js file after Vercel builds your app.



"scripts": {

&#x20;   "dev": "next dev",

&#x20;   "build": "next build",

&#x20;   "start": "next start",

&#x20;   "lint": "next lint",

&#x20;   "postbuild": "node ./scripts/add-urls-to-kinde.js"

}



Commit these changes. The next deploy will add the newly created preview URLs to your Kinde application.



Health check

Link to this section

To check your configuration, the SDK exposes an endpoint with your settings.



Note: The client secret will indicate only if the secret is set or not set correctly.



/api/auth/health



{

&#x20; "apiPath": "/api/auth",

&#x20; "redirectURL": "http://localhost:3000/api/auth/kinde\_callback",

&#x20; "postLoginRedirectURL": "http://localhost:3000/dashboard",

&#x20; "issuerURL": "https://<your\_kinde\_subdomain>.kinde.com",

&#x20; "clientID": "<your\_kinde\_client\_id>",

&#x20; "clientSecret": "Set correctly",

&#x20; "postLogoutRedirectURL": "http://localhost:3000",

&#x20; "logoutRedirectURL": "http://localhost:3000"

}



State not found error

Link to this section

Solution

Link to this section

Confirm that the domain you start the auth flow from is different from the domain you are redirected to after the auth flow is complete. If this is not the case, see the explanation.

Dynamically set the KINDE\_SITE\_URL and KINDE\_POST\_LOGIN\_REDIRECT\_URL when working with vercel preview domains. If you are using Vercel, you can set the KINDE\_SITE\_URL and KINDE\_POST\_LOGIN\_REDIRECT\_URL dynamically.

next.config.js

const nextConfig = {

&#x20; env: {

&#x20;   KINDE\_SITE\_URL: process.env.KINDE\_SITE\_URL ?? `https://${process.env.VERCEL\_URL}`,

&#x20;   KINDE\_POST\_LOGOUT\_REDIRECT\_URL:

&#x20;     process.env.KINDE\_POST\_LOGOUT\_REDIRECT\_URL ?? `https://${process.env.VERCEL\_URL}`,

&#x20;   KINDE\_POST\_LOGIN\_REDIRECT\_URL:

&#x20;     process.env.KINDE\_POST\_LOGIN\_REDIRECT\_URL ?? `https://${process.env.VERCEL\_URL}/dashboard`

&#x20; }

};



module.exports = nextConfig;



Explanation

Link to this section

The State not found error in production is usually a result of a mismatch between a few variables.



KINDE\_SITE\_URL and/or KINDE\_POST\_LOGIN\_REDIRECT\_URL

The domain you are on e.g. your-app-projects.vercel.app

Callback URL set on the Kinde dashboard

If you set KINDE\_SITE\_URL=https:// your-app-projects.vercel.app and KINDE\_POST\_LOGIN\_REDIRECT\_URL=https:// your-app-projects.vercel.app/dashboard. And you also set your Callback URL to be your-app-\\\*.vercel.app/api/auth/kinde\_callback. You should be able to click login and complete the auth flow.



However if you start the auth flow from a Vercel preview domain your-app-PREVIEW-projects.vercel.app and complete the auth flow, you will be redirected to your-app-projects.vercel.app/api/auth/kinde\_callback which is NOT the same as the domain you started the auth flow on.



The error happens because when you start the auth flow, a state cookie is set which needs to be checked against when you return back to your app. In this case, you are NOT being redirect to the app you started the flow on, but rather another domain where the app is running which does not have the state cookie. Since there is a state cookie mismatch, the auth flow is aborted for security reasons.



The reason why you are redirected to the wrong domain because is likely because your KINDE\_POST\_LOGIN\_REDIRECT\_URL environment variable is static and is set for all your deployments/domains.



You should set the KINDE\_POST\_LOGIN\_REDIRECT\_URL dynamically based on the domain you initiating the auth flow from.



Clearing Kinde session cookies manually

Link to this section

There are situations — such as debugging a stuck session, forcing a clean logout without a redirect, or testing authentication flows — where you may need to clear Kinde’s session cookies directly from your Next.js application.



Step 1: Identify the cookies

Link to this section

Kinde stores session data in httpOnly cookies. Open your browser’s DevTools (Application > Cookies) after signing in and look for cookies that match these patterns on your domain:



ac-state-key — state parameter cookie set at the start of the auth flow

id\_token — ID token cookie (if set)

access\_token — access token cookie (if set)

refresh\_token\_<prefix> — refresh token cookie (prefix is the first 6 characters of your Kinde client ID, e.g. refresh\_token\_abc123)

The exact set of cookies present depends on your SDK version and configuration.



Step 2: Clear the cookies via an API route

Link to this section

Create a server-side API route to delete the cookies. This must be done server-side because the cookies are httpOnly and cannot be deleted from client-side JavaScript.



app/api/auth/clear-session/route.ts

import { cookies } from "next/headers"

import { NextResponse } from "next/server"



export async function POST() {

&#x20; const cookieStore = await cookies()

&#x20; const allCookies = cookieStore.getAll()



&#x20; // Delete all cookies that belong to Kinde

&#x20; const kindeCookiePatterns = \["ac-state-key", "id\_token", "access\_token", "refresh\_token\_"]



&#x20; for (const cookie of allCookies) {

&#x20;   if (kindeCookiePatterns.some((pattern) => cookie.name.startsWith(pattern))) {

&#x20;     cookieStore.delete(cookie.name)

&#x20;   }

&#x20; }



&#x20; return NextResponse.redirect(new URL("/", process.env.KINDE\_SITE\_URL ?? "http://localhost:3000"))

}



Step 3: Call the route

Link to this section

Navigate the user to /api/auth/clear-session to clear the session, or call it programmatically:



// Trigger from a button or link in your UI

<form action="/api/auth/clear-session" method="post">

&#x20; <button type="submit">Clear session</button>

</form>



Clearing cookies manually ends the local session but does not sign the user out of Kinde’s authorization server. To fully sign a user out — including ending the Kinde session — use the standard logout flow instead. Use cookie clearing only as a debugging tool or last resort.



Debug mode

Link to this section

In debug mode you will see more logs in your console that may help with debugging.



.env

KINDE\_DEBUG\_MODE=true



Version compatibility

Link to this section

Which Next.js versions does the Kinde SDK support?

Link to this section

The @kinde-oss/kinde-auth-nextjs SDK supports Next.js 12 through 16. Each major Next.js version requires a minimum SDK version — make sure you’re on a compatible release before upgrading Next.js.



Next.js version	Minimum SDK version

12.3.x	2.x

13.5.x	2.x

14.2.x	2.x

15.2.x	2.x

16.x	2.11.0

For the latest compatibility information, check the @kinde-oss/kinde-auth-nextjs npm page or release notes.



Migrate from V1

Link to this section

If you are migrating from the previous version, there are some changes you need to be aware of.



handleAuth is now imported from @kinde-oss/kinde-auth-nextjs/server



import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

export const GET = handleAuth();



getKindeServerSession functions now return promises.



const { getUser } = getKindeServerSession();

const user = await getUser();



Was this page helpful?

Yes

