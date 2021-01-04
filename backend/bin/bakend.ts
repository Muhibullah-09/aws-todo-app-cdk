#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BakendStack } from '../lib/bakend-stack';

const app = new cdk.App();
new BakendStack(app, 'BakendStack');
