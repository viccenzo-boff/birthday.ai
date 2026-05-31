module.exports = {
  apps: [
    {
      name: "birthday-backend",
      script: "node",
      args: "-r ts-node/register src/index.ts",
      env: {
        NODE_ENV: "development",
      }
    }
  ]
};