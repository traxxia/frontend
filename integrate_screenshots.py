#!/usr/bin/env python3
"""
Screenshot Integration Script for Traxxia Academy
Maps and replaces ALT_TEXT_PLACEHOLDER with actual screenshot paths
"""

import os
import re
import shutil
from pathlib import Path

# Source directory with downloaded screenshots
SOURCE_DIR = Path.home() / "Desktop/academy-screenshots-temp/traxxia-screenshots"

# Target directory for organized screenshots
TARGET_DIR = Path.home() / "Desktop/personallocaldev/Traxxia/frontend/public/academy-screenshots"

# Academy content directory
CONTENT_DIR = Path.home() / "Desktop/personallocaldev/Traxxia/frontend/public/academy-content"

# Category mappings
CATEGORY_MAP = {
    "getting-started": "01-getting-started",
    "business-management": " 02-businesses",
    "questionnaire": "03-questionnaire",
    "strategic-analysis": "04-strategic-analysis",
    "financial-analysis": "05-financial-analysis",
    "projects": "06-projects",
    "collaboration": "07-collaboration",
}

# Manual mappings for screenshots to categories and filenames
SCREENSHOT_MAPPINGS = {
    # Getting Started
    "Registration page (full screen).png": ("getting-started", "registration-page-full.png"),
    "Registration form filled out (example data).png": ("getting-started", "registration-form-filled.png"),
    "Login page.png": ("getting-started", "login-page.png"),
    "Dashboard after first login for role orgadmin.png": ("getting-started", "dashboard-orgadmin-first-login.png"),
    "Dashboard after first login for users.png": ("getting-started", "dashboard-user-first-login.png"),
    "Dashboard after first login for collaborator.png": ("getting-started", "dashboard-collaborator-first-login.png"),
    "Dashboard after first login for viewers.png": ("getting-started", "dashboard-viewer-first-login.png"),
    "Dashboard with 2-3 businesses listed (showing sectioned list).png": ("getting-started", "dashboard-business-list.png"),
    "Language selector dropdown.png": ("getting-started", "language-selector.png"),
    "Role indicator in UI.png": ("getting-started", "role-indicator.png"),
    
    # Business Management
    "Create Business button location.png": ("business-management", "create-business-button.png"),
    "Business creation modal.png": ("business-management", "business-creation-modal.png"),
    "Business creation form with sample data.png": ("business-management", "business-creation-form.png"),
    "Success confirmation after business creation.png": ("business-management", "business-creation-success.png"),
    "Business list view.png": ("business-management", "business-list-view.png"),
    "Business card with showing progress.png": ("business-management", "business-card-progress.png"),
    "Business actions menu (edit, delete, etc.).png": ("business-management", "business-actions-menu.png"),
    "Delete confirmation dialog.png": ("business-management", "delete-confirmation.png"),
    "Business limit reached message (5 businesses).png": ("business-management", "business-limit-reached.png"),
    "Validation error states.png": ("business-management", "validation-errors.png"),
    
    # Questionnaire
    "AI assistant chat interface (fresh start).png": ("questionnaire", "chat-interface-fresh.png"),
    "First question being asked by AI.png": ("questionnaire", "first-question.png"),
    "User answer being typed.png": ("questionnaire", "user-answer-typing.png"),
    "Text input question.png": ("questionnaire", "text-input-question.png"),
    "User answer submitted (shown in chat history).png": ("questionnaire", "answer-submitted.png"),
    "Chat with 3-5 Q&A exchanges visible.png": ("questionnaire", "chat-qa-exchanges.png"),
    "Completed question indicator.png": ("questionnaire", "completed-indicator.png"),
    "Progress indicator showing _ completion.png": ("questionnaire", "progress-indicator.png"),
    "Phase unlock notification (toast).png": ("questionnaire", "phase-unlock-toast.png"),
    
    # Strategic Analysis
    "Analysis main view (showing available analyses).png": ("strategic-analysis", "analysis-main-view.png"),
    "Analysis tab in navigation.png": ("strategic-analysis", "analysis-tab-nav.png"),
    "Capability Heatmap example .png": ("strategic-analysis", "capability-heatmap.png"),
    "Loyalty and NPS example.png": ("strategic-analysis", "loyalty-nps.png"),
    
    # Financial Analysis
    "Document upload interface.png": ("financial-analysis", "document-upload-interface.png"),
    "File selector dialog.png": ("financial-analysis", "file-selector.png"),
    "File upload prompt (for financial docs).png": ("financial-analysis", "file-upload-prompt.png"),
    
    # Projects
    "Projects tab.png": ("projects", "projects-tab.png"),
    "create project button.png": ("projects", "create-project-button.png"),
    "Project creation form.png": ("projects", "project-creation-form.png"),
    "Individual project card.png": ("projects", "individual-project-card.png"),
    "Project list view.png": ("projects", "project-list-view.png"),
    "Project details view.png": ("projects", "project-details-view.png"),
    "Project ranking interface.png": ("projects", "project-ranking-interface.png"),
    "AI-assisted ranking view.png": ("projects", "ai-assisted-ranking.png"),
    "Kickstart Project.png": ("projects", "kickstart-project.png"),
    
    # Collaboration
    "Add user and collaborator access.png": ("collaboration", "add-user-collaborator.png"),
    "Collaborators list.png": ("collaboration", "collaborators-list.png"),
    "Edit and reranking access for specific project.png": ("collaboration", "edit-reranking-access.png"),
    "Revoke access confirmation.png": ("collaboration", "revoke-access-confirmation.png"),
}


def copy_and_organize_screenshots():
    """Copy screenshots to organized directory structure"""
    print("📁 Organizing screenshots...")
    copied_count = 0
    
    for source_filename, (category, target_filename) in SCREENSHOT_MAPPINGS.items():
        source_path = SOURCE_DIR / source_filename
        target_category_dir = TARGET_DIR / category
        target_path = target_category_dir / target_filename
        
        if not source_path.exists():
            print(f"  ⚠️  Source not found: {source_filename}")
            continue
        
        # Create category directory if it doesn't exist
        target_category_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy file
        shutil.copy2(source_path, target_path)
        print(f"  ✅ {source_filename} → {category}/{target_filename}")
        copied_count += 1
    
    print(f"\n✅ Copied {copied_count} screenshots to organized directories\n")
    return copied_count


def update_markdown_files():
    """Find and replace ALT_TEXT_PLACEHOLDER in markdown files"""
    print("📝 Updating markdown files...")
    
    replacements_made = 0
    files_updated = 0
    
    # Walk through all markdown files
    for md_file in CONTENT_DIR.rglob("*.md"):
        content = md_file.read_text()
        original_content = content
        
        # Find all ALT_TEXT_PLACEHOLDER instances
        pattern = r'!\[([^\]]+)\]\(ALT_TEXT_PLACEHOLDER\)'
        matches = re.findall(pattern, content)
        
        if not matches:
            continue
        
        print(f"\n📄 {md_file.relative_to(CONTENT_DIR)}")
        
        for alt_text in matches:
            # Try to find matching screenshot
            screenshot_path = find_matching_screenshot(alt_text, md_file)
            
            if screenshot_path:
                # Replace placeholder with actual path
                old_string = f"![{alt_text}](ALT_TEXT_PLACEHOLDER)"
                new_string = f"![{alt_text}]({screenshot_path})"
                content = content.replace(old_string, new_string, 1)
                print(f"  ✅ {alt_text[:60]}... → {screenshot_path}")
                replacements_made += 1
            else:
                print(f"  ⚠️  No match: {alt_text[:60]}...")
        
        # Write updated content if changes were made
        if content != original_content:
            md_file.write_text(content)
            files_updated += 1
    
    print(f"\n✅ Made {replacements_made} replacements in {files_updated} files\n")
    return replacements_made, files_updated


def find_matching_screenshot(alt_text, md_file_path):
    """
    Find the best matching screenshot for given ALT text
    Returns the web path (/academy-screenshots/category/filename.png)
    """
    alt_lower = alt_text.lower()
    
    # Determine category from file path
    file_parts = md_file_path.parts
    category_dir = None
    for part in file_parts:
        if part.startswith(('01-', '02-', '03-', '04-', '05-', '06-', '07-')):
            category_dir = part
            break
    
    if not category_dir:
        return None
    
    # Map content category to screenshot category
    category_names = {
        "01-getting-started": "getting-started",
        "02-businesses": "business-management",
        "03-questionnaire": "questionnaire",
        "04-strategic-analysis": "strategic-analysis",
        "05-financial-analysis": "financial-analysis",
        "06-projects": "projects",
        "07-collaboration": "collaboration",
    }
    
    screenshot_category = category_names.get(category_dir)
    if not screenshot_category:
        return None
    
    # Search for matching screenshots in the category
    category_path = TARGET_DIR / screenshot_category
    if not category_path.exists():
        return None
    
    # Keyword matching
    keywords_map = {
        # Getting Started
        "registration page": "registration-page-full.png",
        "registration form filled": "registration-form-filled.png",
        "login page": "login-page.png",
        "dashboard for new admin": "dashboard-orgadmin-first-login.png",
        "dashboard.*orgadmin": "dashboard-orgadmin-first-login.png",
        "dashboard.*collaborator": "dashboard-collaborator-first-login.png",
        "dashboard.*viewer": "dashboard-viewer-first-login.png",
        "business cards showing": "dashboard-business-list.png",
        "dashboard.*business.*list": "dashboard-business-list.png",
        "language.*selector": "language-selector.png",
        "role.*indicator": "role-indicator.png",
        
        # Business Management
        "create.*business.*button": "create-business-button.png",
        "create business modal": "business-creation-modal.png",
        "business.*form": "business-creation-form.png",
        "success.*business": "business-creation-success.png",
        "business list": "business-list-view.png",
        "business card.*progress": "business-card-progress.png",
        "business.*action": "business-actions-menu.png",
        "delete confirmation": "delete-confirmation.png",
        
        # Questionnaire
        "ai.*chat": "chat-interface-fresh.png",
        "ai.*question": "first-question.png",
        "answer.*typing": "user-answer-typing.png",
        "text input": "text-input-question.png",
        "answer submitted": "answer-submitted.png",
        "chat.*exchanges": "chat-qa-exchanges.png",
        "completed.*indicator": "completed-indicator.png",
        "progress.*completion": "progress-indicator.png",
        "phase unlock": "phase-unlock-toast.png",
        
        # Strategic Analysis
        "analysis.*main": "analysis-main-view.png",
        "analysis tab": "analysis-tab-nav.png",
        "capability.*heatmap": "capability-heatmap.png",
        "loyalty.*nps": "loyalty-nps.png",
        
        # Financial Analysis
        "document upload": "document-upload-interface.png",
        "file selector": "file-selector.png",
        "financial.*upload": "file-upload-prompt.png",
        
        # Projects
        "projects tab": "projects-tab.png",
        "create project.*button": "create-project-button.png",
        "project.*form": "project-creation-form.png",
        "individual project": "individual-project-card.png",
        "project list": "project-list-view.png",
        "project details": "project-details-view.png",
        "ranking interface": "project-ranking-interface.png",
        "ai.*ranking": "ai-assisted-ranking.png",
        
        # Collaboration
        "invite.*collaborator": "add-user-collaborator.png",
        "collaborators list": "collaborators-list.png",
        "edit.*access": "edit-reranking-access.png",
        "revoke access": "revoke-access-confirmation.png",
    }
    
    # Try pattern matching
    for pattern, filename in keywords_map.items():
        if re.search(pattern, alt_lower):
            file_path = category_path / filename
            if file_path.exists():
                return f"/academy-screenshots/{screenshot_category}/{filename}"
    
    # Fallback: try direct filename match
    for png_file in category_path.glob("*.png"):
        web_path = f"/academy-screenshots/{screenshot_category}/{png_file.name}"
        return web_path
    
    return None


def main():
    print("=" * 60)
    print("  TRAXXIA ACADEMY SCREENSHOT INTEGRATION")
    print("=" * 60)
    print()
    
    # Step 1: Copy and organize screenshots
    copied = copy_and_organize_screenshots()
    
    # Step 2: Update markdown files
    replacements, files = update_markdown_files()
    
    # Summary
    print("=" * 60)
    print("  INTEGRATION COMPLETE")
    print("=" * 60)
    print(f"  Screenshots copied: {copied}")
    print(f"  Replacements made: {replacements}")
    print(f"  Files updated: {files}")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
