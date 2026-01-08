import React from "react";
import { Accordion, Table, Badge } from "react-bootstrap";
import { Users } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import ConsensusButtonPopover from "./ConsensusButtonPopover";

const TeamRankingsView = ({
  activeAccordionKey,
  onAccordionSelect,
  isSuperAdmin,
  user,
  sortedProjects,
  rankMap,
  adminRankMap,
  userRole,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rank-list mt-4">
      <Accordion activeKey={activeAccordionKey} onSelect={onAccordionSelect}>
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <div className="d-flex flex-column">
              <div className="d-flex align-items-center gap-2">
                <Users size={18} className="text-info" />
                <strong>{t("Team_Rankings_View")}</strong>
              </div>
              {isSuperAdmin && (
                <small className="text-muted">
                  {t("See_how_all_team_members_ranked_projects")}
                </small>
              )}
              {!isSuperAdmin && (
                <small className="text-muted">See the ranked projects</small>
              )}
            </div>
          </Accordion.Header>
          <Accordion.Body>
            {isSuperAdmin && (
              <div className="d-flex gap-4 mb-3">
                <span>🟢 {t("High_Agreement")}</span>
                <span>🟡 {t("Medium_Agreement")}</span>
                <span>🔴 {t("Low_Agreement")}</span>
              </div>
            )}
            <Table hover responsive>
              <thead>
                <tr>
                  <th>{t("Project")}</th>
                  {!isSuperAdmin && <th className="text-center">{user}</th>}
                  <th className="text-center">AI Rank</th>
                  {isSuperAdmin && <th className="text-center">{t("Consensus")}</th>}
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((p) => {
                  const key = String(p._id);
                  const userRank = rankMap[key];
                  const adminRank = adminRankMap[key];

                  return (
                    <tr key={p._id}>
                      <td>{p.project_name}</td>
                      {!isSuperAdmin && (
                        <td className="text-center">
                          <Badge pill bg="primary">
                            {userRank ?? "-"}
                          </Badge>
                        </td>
                      )}
                      <td className="text-center">
                        <Badge pill bg="primary">
                          {userRank ?? "-"}
                        </Badge>
                      </td>
                      {isSuperAdmin && (
                        <td className="text-center">
                          <ConsensusButtonPopover
                            userRole={userRole}
                            userRank={userRank}
                            adminRank={adminRank}
                            project={p}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default TeamRankingsView;