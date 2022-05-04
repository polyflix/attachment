# NestJS Microservice boilerplate

## Getting started

In order to run the application:

```
npm ci
npm run start:dev
```

You should have the appropriate configuration and services running on your machine
in order to ensure the application is launching properly (cf. the [bootstrap repository](https://gitlab.polytech.umontpellier.fr/polyflix-do/bootstrap)).

## OpenAPI specification

You should update the [OpenAPI yaml file](./src/resources/openapi.yml) in order to provide documentation about the HTTP endpoints of your service. A [Swagger UI](https://swagger.io/tools/swagger-ui/) page that describes your API is available at `/{version}/docs`.

## Telemetry

This application is based on [@opentelemetry-js](https://github.com/open-telemetry/opentelemetry-js/),
so metrics and traces are generated through it. Moreover, logs (in production
environment) have fields (`trace.id` and `span.id`) in order to correlate logs
with traces. You can find the configuration files for tracing in [`tracing.config.ts`](./src/main/configuration/tracing.config.ts).
**When forking the boilerplate, you should update [`tracing.config.ts:12`](./src/main/configuration/tracing.config.ts#L12)
to match your service.**

Learn more about how you can use spans in your code with [nestjs-otel](https://github.com/pragmaticivan/nestjs-otel).
And more globally, to learn about telemetry, see this [CNCF](https://github.com/cncf/tag-observability/blob/main/whitepaper.md)
article.

## Configuration

The service configuration is handled over YAML and environment variables.

In `src/resources`, you'll find a file, `application.yml` which contains the service configuration in YAML format. This file is the **first file loaded by the service.**.

For example, by default the `src/resources/application.yml` contains :

```yaml
server:
  port: 8080
```

You can add all the configuration required by your service here. Every key/values will be loaded into your application context.

To access a configuration value in your code, you can simply do the following :

```ts
const config = app.get<ConfigService>(ConfigService);
const port = config.get<number>("server.port", 3000);

console.log(port); // 8080
```

If you need to define environment specific variables, you can simply create another file, in the following format : `application.${ENVIRONMENT}.yml`. For example, for a `production` environment, you'll create the file `src/resources/application.production.yml` :

> By default, the service will assume that your configuration files are located into `resources`. If you're in a Docker container for example, and that your configuration files were copied into `/etc/app/config`, you can simply use the special environment variable `NEST_ADDITIONAL_CONFIG_LOCATION=/etc/app/config` to specify the service to check for configurations into the directory specified.

```yaml
# src/resources/application.production.yml
server:
  tls: true
```

```ts
const config = app.get<ConfigService>(ConfigService);
const port = config.get<number>("server.port", 3000);
const useTls = config.get<boolean>("server.tls", false);

console.log(port); // 8080
console.log(useTls); // true
```

The configuration keys from different sources will be merged at the runtime. So you can define some common configurations into the `application.yml`, and add more environment specific variables into `application.${ENVIRONMENT}.yml`.

The last thing about configuration is that everything is overridable by environment. If you wish to override the `server.port` for example, you can simply export the variable `NEST_SERVER_PORT`.

**Be careful, environment variables take precedence over each other configuration method. You'll find below how the service will load it's configuration :**

- `application.yml`
- `application.${ENVIRONMENT}.yml`
- Environment variables

## Kafka

Official documentation: https://docs.nestjs.com/microservices/kafka

If you need to use Kafka, you must inject the client in your class.

```ts
  constructor(
    @InjectKafkaClient() private readonly client: ClientKafka
  ) {}
```

You can use the `@Expose()` decorator to set only a specific property to be sent to the topic.
In the example below, only the id and title will be sent to the topic.

```ts
export class Foo {
  @Expose()
  id: string;

  @Expose()
  title: string;

  views: string;
}
```

In order to use the `@Expose()` decorator, you must use the `KafkaEventBuilder`.

```ts
const message = new KafkaEventBuilder(id, element)
  .withTrigger(TriggerType.CREATE)
  .build();

this.kafkaClient.emit(FOO_TOPICS, message);
```
