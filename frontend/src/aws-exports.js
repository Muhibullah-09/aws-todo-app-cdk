/* eslint-disable */
// WARNING: DO NOT EDIT. This file is automatically generated by AWS Amplify. It will be overwritten.

const awsmobile = {
    "aws_project_region": "us-east-2",
    "aws_appsync_graphqlEndpoint": "https://vstztlpdpfguxihy3likfgxkhi.appsync-api.us-east-2.amazonaws.com/graphql",
    "aws_appsync_region": "us-east-2",
    "aws_appsync_authenticationType": "API_KEY",
    "aws_appsync_apiKey": "da2-bvquo3w2ivgh3auqky6hybc7fm",
    aws_cognito_region: "us-east-2", // REGION
    aws_user_pools_id: "us-east-2_M2q3mR8KP", // ENTER YOUR USER POOL ID
    aws_user_pools_web_client_id: "bamt0q1tcf37obqcgj19hqfp", // ENTER YOUR CLIENT ID
    oauth: {
      domain: "muhib-todos.auth.us-east-2.amazoncognito.com", // ENTER YOUR COGNITO DOMAIN LIKE: eru-test-pool.auth.eu-west-1.amazoncognito.com here 'eru-test-pool' is the domainPrefix I had set in the backend.
      scope: ["phone", "email", "openid", "profile"],
      redirectSignIn: "http://localhost:8000/", // ENTER YOUR SITE (enter http://localhost:8000 if testing frontend locally)
      redirectSignOut: "http://localhost:8000/", // ENTER YOUR SITE (enter http://localhost:8000 if testing frontend locally)
      responseType: "code",
    },
    federationTarget: "COGNITO_USER_POOLS",
};


export default awsmobile;
