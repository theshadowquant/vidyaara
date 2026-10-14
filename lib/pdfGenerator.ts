import { jsPDF } from 'jspdf';
import type { StudyPlan } from '@/types';

export function exportStudyPlanToPdf(plan: StudyPlan): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  function checkPageOverflow(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      renderMiniHeader();
    }
  }

  function renderMiniHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('VIDYAARAA AI STUDY PLANNER · EXAM ROADMAP', margin, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  }

  // --- BRAND HEADER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 212, 170); // accent turquoise
  doc.text('VIDYAARAA AI', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text('PERSONALIZED EXAM REVISION ROADMAP', margin + 6, y + 15);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Powered by ChatGPT · Developed by Team SQuantrix', margin + 6, y + 20);

  // Date on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`EXAM TARGET: ${plan.examDate}`, pageWidth - margin - 6, y + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Daily Budget: ${plan.dailyHours} hrs/day`, pageWidth - margin - 6, y + 16, { align: 'right' });

  y += 29;

  // --- OVERVIEW & STATS BOX ---
  const completedCount = plan.schedule.filter((s) => s.completed).length;
  const totalSlots = plan.schedule.length;
  const progressPercent = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  const colW = contentWidth / 4;
  doc.text(`Subjects: ${plan.subjects.length}`, margin + 4, y + 8.5);
  doc.text(`Total Slots: ${totalSlots}`, margin + colW + 4, y + 8.5);
  doc.text(`Progress: ${progressPercent}%`, margin + colW * 2 + 4, y + 8.5);
  doc.text(`Created: ${plan.createdAt.slice(0, 10)}`, margin + colW * 3 + 4, y + 8.5);

  y += 18;

  // --- AI STRATEGY SECTION ---
  if (plan.aiStrategy) {
    checkPageOverflow(26);
    doc.setFillColor(240, 253, 250); // emerald tint
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 118, 110);
    doc.text('AI Strategic Recommendation', margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const splitStrategy = doc.splitTextToSize(plan.aiStrategy, contentWidth - 8);
    doc.text(splitStrategy, margin + 4, y + 10.5);

    y += 24;
  }

  // --- TIPS SECTION ---
  if (plan.tips && plan.tips.length > 0) {
    checkPageOverflow(22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Revision Tactics & Best Practices:', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    plan.tips.forEach((tip) => {
      checkPageOverflow(6);
      doc.text(`• ${tip}`, margin + 3, y);
      y += 4.5;
    });

    y += 4;
  }

  // --- SUBJECTS BREAKDOWN TABLE ---
  checkPageOverflow(20 + plan.subjects.length * 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Enrolled Subjects Breakdown:', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subject Title', margin + 3, y + 4.2);
  doc.text('Difficulty', margin + 110, y + 4.2);
  doc.text('Target Revision Time', margin + 145, y + 4.2);
  y += 7;

  doc.setFont('helvetica', 'normal');
  plan.subjects.forEach((sub) => {
    checkPageOverflow(6);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.text(sub.name, margin + 3, y + 4);

    const diffUpper = sub.difficulty.toUpperCase();
    if (sub.difficulty === 'hard') {
      doc.setTextColor(220, 38, 38);
    } else if (sub.difficulty === 'medium') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(16, 185, 129);
    }
    doc.text(diffUpper, margin + 110, y + 4);

    doc.setTextColor(71, 85, 105);
    doc.text(`${sub.hoursNeeded} hrs baseline`, margin + 145, y + 4);

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
    y += 6;
  });

  y += 6;

  // --- DAY-BY-DAY AGENDA TABLE ---
  checkPageOverflow(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Day-by-Day Agenda & Printable Checklist:', margin, y);
  y += 4.5;

  // Schedule Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('[ ]', margin + 3, y + 4.5);
  doc.text('Date / Day', margin + 11, y + 4.5);
  doc.text('Subject', margin + 48, y + 4.5);
  doc.text('Duration', margin + 98, y + 4.5);
  doc.text('Module / Focus Topics', margin + 120, y + 4.5);
  y += 7.5;

  plan.schedule.forEach((session, index) => {
    checkPageOverflow(8.5);

    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 8, 'F');
    }

    // Checkbox box for physical printing & ticking
    doc.setDrawColor(148, 163, 184);
    doc.rect(margin + 3, y + 2, 3.5, 3.5, 'D');

    if (session.completed) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(16, 185, 129);
      doc.text('✓', margin + 3.8, y + 4.8);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    // Date
    doc.text(`${session.date} (${session.day.slice(0, 3)})`, margin + 11, y + 5);

    // Subject
    const subTitle = session.subjectName.length > 25 ? session.subjectName.slice(0, 24) + '…' : session.subjectName;
    doc.setFont('helvetica', 'bold');
    doc.text(subTitle, margin + 48, y + 5);

    // Duration
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${session.durationHours} hrs`, margin + 98, y + 5);

    // Focus Topic
    const focus = session.focusTopics || 'Comprehensive module revision and problem solving';
    const splitFocus = doc.splitTextToSize(focus, contentWidth - 124);
    doc.text(splitFocus[0] || focus, margin + 120, y + 5);

    y += 8;
  });

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Vidyaaraa AI Study Planner · Page ${i} of ${totalPages} · vidyaaraa.vercel.app`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const cleanDate = plan.examDate ? plan.examDate.replace(/[^a-zA-Z0-9-]/g, '_') : 'schedule';
  doc.save(`Vidyaaraa_Study_Plan_${cleanDate}.pdf`);
}
