# Communication Service Monolith Setup & Configurations

We have successfully integrated the outbox pattern delivery strategy consumer, the dead letter queue (DLQ) retry API, and the postal spooled delivery mocks into the main monolith codebase.

## 1. Directory Structure

All components are grouped under the modular package `com.notifyhub.communication`:
- **Model Entities**: [Communication](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/model/Communication.java) and [DeliveryAttempt](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/model/DeliveryAttempt.java) mapping dispatches.
- **JPA Repositories**: [CommunicationRepository](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/repository/CommunicationRepository.java) and [DeliveryAttemptRepository](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/repository/DeliveryAttemptRepository.java).
- **Delivery Strategy Factory**: [DeliveryStrategyFactory](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/delivery/DeliveryStrategyFactory.java) mapping strategies for routing channels.
- **Concrete Strategies**: [EmailStrategy](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/delivery/EmailStrategy.java), [WhatsappStrategy](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/delivery/WhatsappStrategy.java), and [PostalStrategy](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/delivery/PostalStrategy.java).
- **Kafka Listener**: [CommunicationConsumer](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/consumer/CommunicationConsumer.java).
- **Background Scheduler**: [PostalMockScheduler](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/service/PostalMockScheduler.java).
- **DLQ REST API**: [CommunicationDlqController](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/java/com/notifyhub/communication/controller/CommunicationDlqController.java).

## 2. Kafka Listener Configuration

The listener consumes the `communication.created` topic and routes requests:
- **Consumer properties** are declared inside [application.yaml](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/src/main/resources/application.yaml):
  ```yaml
  spring:
    kafka:
      bootstrap-servers: localhost:29092
      consumer:
        group-id: communication-group
        auto-offset-reset: earliest
        key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
        value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
  ```
- **Monolith Dependency**:
  Maven dependencies `spring-boot-starter-kafka` and PDF builder `openhtmltopdf-pdfbox` (version `1.0.10`) are declared inside [pom.xml](file:///Users/akashpatil/Documents/Development/Java/Spring/notifyhub/server/notifyhub/pom.xml).

## 3. Retries & Dead Letter Queue (DLQ)
- A maximum retry limit of `3` is defined. If outbound strategies throw connection issues, the request increments the count, transitions to `RETRYING`, and publishes onto Kafka after a 5-second backoff.
- After 3 unsuccessful attempts, the record status updates to `DEAD_LETTER` to await manual recovery action.
- The `CommunicationDlqController` provides:
  - `GET /api/v1/dlq`: Fetches failed communications.
  - `POST /api/v1/dlq/{id}/retry`: Resets attempt counts and pushes events back onto Kafka.
