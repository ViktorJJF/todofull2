/**
 * Esta clase solo es para controlar los mensajes enviados a agentes
 */

/**
 * Cada elemento tendrá forma { cleanLeadId,source: ORDER | BOT, date }
 */
class WhatsappMessages {
  constructor() {
    this.sentMessageToAgents = [];
  }

  setSentMessageToAgent(cleanLeadId, source) {
    this.sentMessageToAgents.push({ cleanLeadId, source, date: Date.now() });
    return;
  }
  getSentMessageToAgent(cleanLeadId, source) {
    // primero, borrar mensajes de mas de 12h
    this.cleanSentMessageToAgent();
    let index = this.sentMessageToAgents.findIndex(
      (el) =>
        el.cleanLeadId.toString() == cleanLeadId.toString() &&
        el.source === source,
    );
    return index > -1 ? this.sentMessageToAgents[index] : null;
  }
  cleanSentMessageToAgent() {
    // se limpia los mensajes de mas de 12h, para que se puedan enviar de nuevo
    this.sentMessageToAgents = this.sentMessageToAgents.filter(
      (el) => Date.now() - el.date < 12 * 60 * 60 * 1000,
    );
  }
}

let whatsappMessages = new WhatsappMessages();

module.exports = whatsappMessages;
