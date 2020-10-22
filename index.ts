import bodyParser = require("body-parser");
import express = require("express");
import OAuth2Server = require("oauth2-server");
import JWT = require("jsonwebtoken");
import fs = require("fs");
import crypto = require("crypto-random-string");

// rest of the code remains same
const PORT = 3000;

// In-memory datastores
var oauthClients = [
  {
    id: "1",
    redirectUris: "",
    grants: ["password", "refresh_token"],
    accessTokenLifetime: 60 * 60 * 24 * 30,
    refreshTokenLifetime: 60 * 60 * 24 * 60,
  },
];

const users = [
  {
    id: "15d1365e-01ab-4bb8-a664-97480bd72ec3",
    username: "adam_lesmana",
    password: "hello",
  },
];

const getUserById = (userId: string) => {
  for (let i = 0, len = users.length; i < len; i++) {
    const elem = users[i];
    if (elem.id === userId) {
      return elem;
    }
  }
  // tslint:disable-next-line: no-null-keyword
  return null;
};

const oauth2Model: OAuth2Server.PasswordModel = {
  generateAccessToken: async (
    client: OAuth2Server.Client,
    user: OAuth2Server.User,
    scope: string
  ): Promise<string> => {
    let token: string | PromiseLike<string> | undefined;

    const privateKEY = fs.readFileSync("./oauth-private.key").toString();

    const payload = {
      data: "Adam Lesmana",
    };

    token = JWT.sign(payload, privateKEY, {
      issuer: "HYDRA",
      subject: "ade_londok",
      audience: "aelgees@gmail.com",
      algorithm: "RS256",
    });

    return new Promise((resolve) => resolve(token));
  },
  getUser: async (
    username: string,
    password: string
  ): Promise<OAuth2Server.User | OAuth2Server.Falsey> => {
    for (let i = 0, len = users.length; i < len; i++) {
      const elem = users[i];
      console.log("GET USER");
      if (elem.username === username && elem.password === password) {
        return new Promise((resolve) => resolve(elem));
      }
    }
    return undefined;
  },
  getClient: async (
    clientId: string,
    clientSecret: string
  ): Promise<OAuth2Server.Client | OAuth2Server.Falsey> => {
    for (let i = 0, len = oauthClients.length; i < len; i++) {
      const elem = oauthClients[i];
      console.log("GET CLIENT");

      if (
        clientId === "adam" &&
        (clientSecret === null || clientSecret === "lesmana")
      ) {
        return new Promise((resolve) => resolve(elem));
      }
    }
    return undefined;
  },
  saveToken: async (
    token: OAuth2Server.Token,
    client: OAuth2Server.Client,
    user: OAuth2Server.User
  ): Promise<OAuth2Server.Token> => {
    const publicKEY = fs.readFileSync("./oauth-public.key", "utf8");

    const { accessToken } = token;

    JWT.verify(accessToken, publicKEY, {
      issuer: "HYDRA",
      subject: "ade_londok",
      audience: "aelgees@gmail.com",
      algorithms: ["RS256"],
    });

    return {
      ...token,
      client: {
        id: "1",
        redirectUris: "",
        grants: ["password", "refresh_token"],
        accessTokenLifetime: 60 * 60 * 24 * 30,
        refreshTokenLifetime: 60 * 60 * 24 * 60,
      },
      user: {
        id: "123",
        username: "adam_lesmana",
      },
    };
  },
  getAccessToken: async (accessToken: string): Promise<OAuth2Server.Token> => {
    const publicKEY = fs.readFileSync("./oauth-public.key", "utf8");

    JWT.verify(accessToken, publicKEY, {
      issuer: "HYDRA",
      subject: "ade_londok",
      audience: "aelgees@gmail.com",
      algorithms: ["RS256"],
    });

    console.log("GET ACCESS TOKEN");
    return {
      accessToken,
      accessTokenExpiresAt: new Date("2020-11-20T18:12:04.914Z"),
      refreshToken:
        "xrVesCBejpl5HdeMKoMbEMOL8NLLPvhbN8uyUoQBaoETejdncS2fLYySFoK60pZ4eM",
      refreshTokenExpiresAt: new Date("2020-12-20T18:12:04.914Z"),
      client: {
        id: "1",
        redirectUris: "",
        grants: ["password", "refresh_token"],
        accessTokenLifetime: 60 * 60 * 24 * 30,
        refreshTokenLifetime: 60 * 60 * 24 * 60,
      },
      user: {
        id: "123",
        username: "adam_lesmana",
      },
    };
  },
  verifyScope: async (
    token: OAuth2Server.Token,
    scope: string
  ): Promise<boolean> => {
    return true;
  },
  generateRefreshToken: async (
    client: OAuth2Server.Client,
    user: OAuth2Server.User,
    scope: string
  ): Promise<string> => {
    return new Promise((resolve) =>
      resolve(crypto({ length: 66, type: "base64" }))
    );
  },
};

const oauth2Server = new OAuth2Server({
  model: oauth2Model,
  // extendedGrantTypes: { password },
  accessTokenLifetime: 60 * 60 * 24 * 30,
  // tslint:disable-next-line: no-null-keyword
  refreshTokenLifetime: 60 * 60 * 24 * 60,
});
// Authenticate user with supplied bearer token
const authenticate = (authenticateOptions?: {}) => {
  const options: undefined | {} = authenticateOptions || {};
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const request = new OAuth2Server.Request(req);
    const response = new OAuth2Server.Response(res);

    try {
      // Test async method of accessing oauth2Server
      const token = await oauth2Server.authenticate(request, response, options);
      // req.user = token;
      next();
    } catch (err) {
      res.status(err.code || 500).json(err);
    }
  };
};

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.all(
  "/oauth2/token",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const request = new OAuth2Server.Request(req);
    const response = new OAuth2Server.Response(res);

    oauth2Server
      .token(request, response)
      .then((token: OAuth2Server.Token) => {
        res.json(token);
      })
      .catch((err: any) => {
        res.status(err.code || 500).json(err);
      });
  }
);

app.get(
  "/secure",
  authenticate(),
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.json({ message: "Secure data" });
  }
);

app.get("/", (req, res) => res.send("Express + TypeScript Server"));
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
