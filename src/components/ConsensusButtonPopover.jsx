import React from "react";
import { Badge, Popover, OverlayTrigger } from "react-bootstrap";
import "../styles/ConsensusButtonPopover.css";

const ConsensusButtonPopover = ({ userRole,userRank, adminRank, project }) => {
   const isEditor = userRole === "super_admin" || userRole === "company_admin";
  const getConsensusVariant = (u, a) => {
    if (!u || !a) return "secondary";
    const diff = Math.abs(u - a);
    if (diff === 0) return "success";
    if (diff <= 2) return "warning";
    return "danger";
  };

  const popoverContent = (
    <Popover className="consensus-popover">
      <Popover.Body className="consensus-popover-body">

<table className="consensus-table">
  <tbody>
    <tr>
      <th>Project</th>
      <td>{project.project_name}</td>
    </tr>

    <tr>
      <th>Collaborators</th>
      <td>{(project.collaborators || []).join(", ") || "—"}</td>
    </tr>

    <tr>
      <th>Collaborator Ranking</th>
      <td>{project.collaborator_ranking ?? "—"}</td>
    </tr>

    <tr>
      <th>AI Ranking</th>
      <td>{project.ai_ranking ?? "—"}</td>
    </tr>

    <tr>
      <th>Rationale</th>
      <td className="muted">{project.rationale || "—"}</td>
    </tr>
  </tbody>
</table>


      </Popover.Body>
    </Popover>
  );

   return isEditor ? (
    <OverlayTrigger
      trigger="click"
      placement="left"
      overlay={popoverContent}
      rootClose
      container={document.body}
    >
      <Badge
  pill
  bg={getConsensusVariant(userRank, adminRank)}
  className={`consensus-badge ${isEditor ? "clickable" : ""}`}
  title={isEditor ? "Click to view consensus details" : ""}
>
  &nbsp;
</Badge>

    </OverlayTrigger>
  ) : (
    <Badge
      pill
      bg={getConsensusVariant(userRank, adminRank)}
      className="consensus-badge"
    >
      &nbsp;
    </Badge>
  
  );
};

export default ConsensusButtonPopover;
