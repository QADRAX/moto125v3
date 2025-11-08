"use client";

import * as React from "react";
import type { Moto, MotoType } from "@moto125/api-client";
import MotoCard from "../motos/MotoCard";
import SectionHeader from "@/components/common/SectionHeader";
import ActiveFilterToggle from "./ActiveFilterToggle";
import { SectionTypeHeader } from "../common/SectionTypeHeader";
import { useBrandMotoListLogic } from "./BrandMotoList.hook";

export interface BrandMotoListProps {
  motos?: Moto[] | null;
  motoTypes?: MotoType[] | null;
  className?: string;
  title?: string;
  defaultActiveOnly?: boolean;
}

/**
 * Refined layout:
 * - Larger vertical rhythm between headers and grids.
 * - No padding or frame around the grid (flush with page layout).
 * - Clean spacing hierarchy for visual clarity.
 */
export default function BrandMotoList({
  motos,
  motoTypes,
  className = "",
  title = "Modelos",
  defaultActiveOnly = true,
}: BrandMotoListProps) {
  const { sections, activeOnly, setActiveOnly, hasData, anyActive } =
    useBrandMotoListLogic(motos, motoTypes, defaultActiveOnly);

  if (!hasData) return null;

  return (
    <div className={`space-y-12 ${className}`}>
      <SectionHeader
        title={title}
        action={
          anyActive ? (
            <ActiveFilterToggle checked={activeOnly} onChange={setActiveOnly} />
          ) : undefined
        }
      />

      <div className="space-y-16 mt-8 p-2">
        {sections.map((section) => (
          <section key={section.href} className="scroll-mt-24">
            <div className="mb-8">
              <SectionTypeHeader
                icon={section.icon}
                label={section.label}
                count={section.items.length}
                href={section.href}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.items.map((m) => (
                <div
                  key={m.documentId}
                  className="transition-transform duration-200 hover:scale-[1.02]"
                >
                  <MotoCard moto={m} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
