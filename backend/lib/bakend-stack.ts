import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';

export class BakendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "TodosGoogleUserPool", {
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: { emailStyle: cognito.VerificationEmailStyle.CODE},
      autoVerify: { email: true, },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
    });

    const provider = new cognito.UserPoolIdentityProviderGoogle(this,"MKTodosgoogleProvider",
      {
        userPool: userPool,
        clientId:"",
        clientSecret: "", // Google Client Secret
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
        callbackUrls: ["http://localhost:8000/"], // This is what user is allowed to be redirected to with the code upon signin. this can be a list of urls.
        logoutUrls: ["http://localhost:8000/"], // This is what user is allowed to be redirected to after signout. this can be a list of urls.
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
    todosTable.grantFullAccess(todosLambda)
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

  }
};