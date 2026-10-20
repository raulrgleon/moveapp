import test from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import { emailConfigured, sendHtmlEmail, sendEmailVerificationCode } from "../src/lib/notifications/email.ts";
const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "RESEND_API_KEY"];
test("SMTP uses authenticated TLS and accepts only confirmed recipients", async () => {
  const previous = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const original = nodemailer.createTransport;
  try {
    process.env.SMTP_HOST="smtp.test.invalid";process.env.SMTP_USER="test";process.env.SMTP_PASSWORD="isolated-test-only";process.env.SMTP_PORT="587";
    let config: any;
    nodemailer.createTransport = ((value: unknown) => {config=value;return {sendMail:async()=>({accepted:["test@example.invalid"],rejected:[]})};}) as any;
    assert(emailConfigured());assert((await sendHtmlEmail("test@example.invalid", "Test", "<p>Test</p>")).ok);
    assert.equal(config.requireTLS,true);assert.equal(config.tls.rejectUnauthorized,true);assert.equal(config.tls.minVersion,"TLSv1.2");
    nodemailer.createTransport=(()=>({sendMail:async()=>({accepted:[],rejected:["test@example.invalid"]})})) as any;
    assert.equal((await sendHtmlEmail("test@example.invalid", "Test", "Test")).ok,false);
    await assert.rejects(sendEmailVerificationCode("test@example.invalid","123456"),/unavailable/);
    nodemailer.createTransport=(()=>({sendMail:async()=>{throw new Error("Provider unavailable");}})) as any;
    assert.equal((await sendHtmlEmail("test@example.invalid", "Test", "Test")).ok,false);
  } finally {
    nodemailer.createTransport=original;
    for(const [key,value] of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
});
test("unconfigured email never reports successful code delivery", async()=>{
  const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  try {for(const key of keys)delete process.env[key];assert.equal(emailConfigured(),false);assert.equal((await sendHtmlEmail("test@example.invalid","Test","Test")).ok,false);await assert.rejects(sendEmailVerificationCode("test@example.invalid","123456"));}
  finally {for(const [key,value] of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
