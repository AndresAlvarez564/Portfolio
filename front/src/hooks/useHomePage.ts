import { useEffect, useState } from "react";
import { getProfile } from "../services/profileService";
import { listProjects } from "../services/projectsService";
import { listExperience } from "../services/experienceService";
import { listSkills } from "../services/skillsService";
import { listCertifications } from "../services/certificationsService";
import type { Certification } from "../types/certification";
import type { Experience } from "../types/experience";
import type { ProfileData } from "../types/profile";
import type { Project } from "../types/project";
import type { Skill } from "../types/skill";

type SectionKey = "profile" | "featuredProjects" | "experience" | "skills" | "certifications";

type SectionLoading = Record<SectionKey, boolean>;
type SectionErrors = Partial<Record<SectionKey, string>>;

const initialLoading: SectionLoading = {
  profile: true,
  featuredProjects: true,
  experience: true,
  skills: true,
  certifications: true,
};

export function useHomePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState<SectionLoading>(initialLoading);
  const [errors, setErrors] = useState<SectionErrors>({});

  useEffect(() => {
    let mounted = true;

    const settle = async <T,>(
      key: SectionKey,
      request: Promise<T>,
      onSuccess: (value: T) => void,
      errorMessage: string,
    ) => {
      const [result] = await Promise.allSettled([request]);
      if (!mounted) return;

      if (result.status === "fulfilled") {
        onSuccess(result.value);
      } else {
        setErrors((current) => ({ ...current, [key]: errorMessage }));
      }
      setLoading((current) => ({ ...current, [key]: false }));
    };

    void settle("profile", getProfile(), setProfile, "Profile is unavailable.");
    void settle(
      "featuredProjects",
      listProjects(),
      (projects) => {
        setFeaturedProjects(
          projects
            .filter((project) => project.featured)
            .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
            .slice(0, 3),
        );
      },
      "Featured projects are unavailable.",
    );
    void settle("experience", listExperience(), (items) => setExperience(items.slice(0, 2)), "Experience is unavailable.");
    void settle("skills", listSkills(), setSkills, "Skills are unavailable.");
    void settle("certifications", listCertifications(), (items) => setCertifications(items.slice(0, 3)), "Certifications are unavailable.");

    return () => {
      mounted = false;
    };
  }, []);

  return {
    profile,
    featuredProjects,
    experience,
    skills,
    certifications,
    loading,
    errors,
  };
}
