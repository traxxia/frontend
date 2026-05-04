const getStringValue = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const getDecisionLogActorName = (log) => {
  if (!log) return "-";

  const actorObject =
    typeof log.actor === "object" && log.actor !== null ? log.actor : null;

  const name =
    getStringValue(log.actor_name) ||
    getStringValue(log.user_name) ||
    getStringValue(log.changed_by_name) ||
    getStringValue(log.updated_by_name) ||
    getStringValue(log.created_by_name) ||
    getStringValue(actorObject?.name) ||
    getStringValue(actorObject?.user_name) ||
    getStringValue(actorObject?.full_name) ||
    getStringValue(actorObject?.email) ||
    getStringValue(log.actor) ||
    getStringValue(log.changed_by) ||
    getStringValue(log.updated_by) ||
    getStringValue(log.created_by);

  if (name) return name;

  const actorId =
    log.actor_id ||
    log.user_id ||
    log.changed_by_id ||
    log.updated_by_id ||
    log.created_by_id ||
    actorObject?._id ||
    actorObject?.id;

  return actorId ? `User ${String(actorId).slice(-6)}` : "-";
};
