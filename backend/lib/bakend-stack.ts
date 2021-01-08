import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";

export class BakendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "TodosGoogleUserPool", {
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: { emailStyle: cognito.VerificationEmailStyle.CODE},
      autoVerify: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
    });

    const provider = new cognito.UserPoolIdentityProviderGoogle(this,"googleProvider",
      {
        userPool: userPool,
        clientId:"946189751283-qar9hmgh34n2k95g99bj5t21q92u612u.apps.googleusercontent.com",
        clientSecret: "vs2NiWOpk3qAdVpyS5RIdKZH", // Google Client Secret
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          phoneNumber: cognito.ProviderAttribute.GOOGLE_PHONE_NUMBERS,
        },
        scopes: ["profile", "email", "openid"],
      }
    );
    userPool.registerIdentityProvider(provider);
    const userPoolClient = new cognito.UserPoolClient(this, "todoamplifyClient", {
      userPool,
      oAuth: {
        callbackUrls: ["https://d16gz8068ih3c.cloudfront.net/"], // This is what user is allowed to be redirected to with the code upon signin. this can be a list of urls.
        logoutUrls: ["https://d16gz8068ih3c.cloudfront.net/"], // This is what user is allowed to be redirected to after signout. this can be a list of urls.
      },
    });

    const domain = userPool.addDomain("Todosdomain", {
      cognitoDomain: {
        domainPrefix: "muhib-todos", // SET YOUR OWN Domain PREFIX HERE
      },
    });

    new cdk.CfnOutput(this, "aws_user_pools_web_client_id", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "aws_project_region", {
      value: this.region,
    });
    new cdk.CfnOutput(this, "aws_user_pools_id", {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "domain", {
      value: domain.domainName,
    });



    //This is Appsync graphql Api for lambda function
    const Todo_API = new appsync.GraphqlApi(this, 'Api', {
      name: 'cdk-todos-appsync-api',
      schema: appsync.Schema.fromAsset('schema/schema.gql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
      xrayEnabled: true,
    });


    //This is lambda function
    const todosLambda = new lambda.Function(this, 'AppSyncNotesHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('functions')
    });

    //Here we define our Datasource
    const lambdaDs = Todo_API.addLambdaDataSource('lambdaDatasource', todosLambda);

    //Here we define Dynamodb construct
    const todosTable = new dynamodb.Table(this, 'TodosTable', {
      tableName: "Todos_Table",
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });
    todosTable.grantFullAccess(todosLambda);
    todosLambda.addEnvironment('TODOS_TABLE', todosTable.tableName);

    //Here we define resolvers for queries and for mutations
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getTodos"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "addTodo"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteTodo"
    });

    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: Todo_API.graphqlUrl
    });

    // Prints out the AppSync GraphQL API key to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: Todo_API.apiKey || ''
    });

    //here I define s3 bucket 
    const todosBucket = new s3.Bucket(this, "todosBucket", {
      versioned: true,
    });

    todosBucket.grantPublicAccess(); // website visible to all.

    // create a CDN to deploy your website
    const distribution = new cloudfront.Distribution(this, "TodosDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(todosBucket),
      },
      defaultRootObject: "index.html",
    });


    // Prints out the web endpoint to the terminal
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.domainName,
    });


    // housekeeping for uploading the data in bucket 
    new s3deploy.BucketDeployment(this, "DeployTodoApp", {
      sources: [s3deploy.Source.asset("../frontend/public")],
      destinationBucket: todosBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
};