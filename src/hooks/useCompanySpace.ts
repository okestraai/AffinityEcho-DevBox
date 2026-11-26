import { useEffect, useState } from "react";
import { DecryptData } from "../../api/EncrytionApis";
import { OTHERS_SPACE } from "../constants/spaces";

// The member's company space name and a label for it. Typed companies share Others.
export function useCompanySpace(
  user: { company_encrypted?: string; company_type?: string } | null | undefined,
  enabled = true,
) {
  const [companyName, setCompanyName] = useState("");
  useEffect(() => {
    if (!enabled || !user?.company_encrypted) {
      setCompanyName("");
      return;
    }
    let cancelled = false;
    DecryptData({ encryptedData: user.company_encrypted })
      .then((r: { decryptedData: string }) => {
        if (!cancelled) setCompanyName(r.decryptedData || "");
      })
      .catch(() => {
        if (!cancelled) setCompanyName("");
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, user?.company_encrypted]);

  const isTyped = user?.company_type?.toLowerCase() === "other";
  const space = companyName ? (isTyped ? OTHERS_SPACE : companyName) : "";
  const label = companyName ? (isTyped ? `Others (${companyName})` : companyName) : "";
  return { space, label };
}
