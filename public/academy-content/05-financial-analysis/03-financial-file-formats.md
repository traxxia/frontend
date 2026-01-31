# Financial File Formats & Requirements

Technical guide to Traxxia's financial template requirements for successful data upload and analysis.

---

## Supported File Formats

### Primary: Excel
- **.xlsx** (Excel 2007 and later) ✅ Recommended
- **.xls** (Excel 97-2003) ✅ Supported
- **.csv** (Comma-separated values) ✅ If template-compliant

### Not Supported:
- ❌ PDF
- ❌ Google Sheets (must export to Excel first)
- ❌ Numbers (Apple)
- ❌ Word documents
- ❌ Scanned images

---

## Template Validation Process

### How Traxxia Validates Your File:

#### Step 1: Template Type Detection
AI analyzes file structure to identify:
- Income Statement (P&L)
- Balance Sheet
- Cash Flow Statement

**Confidence Scoring**:
- High (>70%): Auto-detected successfully
- Medium (30-70%): Likely match, manual review suggested
- Low (<30%): File doesn't match templates

---

#### Step 2: Structure Validation
Checks for:
- Required column headers
- Expected row structure
- Data format compliance
- Formula integrity

---

#### Step 3: Data Quality Check
Validates:
- Numeric fields contain numbers
- Dates are properly formatted
- Required cells not empty
- Formulas calculate correctly

---

## Template Structure Requirements

### General Rules for All Templates:

✅ **DO**:
- Keep column headers exactly as provided
- Maintain row order from template
- Use consistent date formats (MM/DD/YYYY or YYYY-MM-DD)
- Enter numbers without currency symbols (unless template has them)
- Leave optional fields blank if data unavailable

❌ **DON'T**:
- Add or remove columns
- Merge cells
- Add extra sheets (unless template supports)
- Change cell formatting significantly
- Include notes in data cells

---

## Income Statement (P&L) Template

### Required Columns:
1. **Period/Date**: Time period for data (Q1 2023, Jan 2024, etc.)
2. **Revenue**: Total revenue/sales
3. **Cost of Goods Sold (COGS)**: Direct costs
4. **Operating Expenses**: Indirect costs
5. **Net Income**: Bottom line profit/loss

### Optional But Valuable:
- Gross Profit (Revenue - COGS)
- Operating Income (Gross Profit - Operating Expenses)
- EBITDA
- Interest Expense
- Tax Expense

### Example Structure:
```
Period      | Revenue  | COGS     | Operating Expenses | Net Income
Q1 2023     | 250,000  | 100,000  | 80,000            | 70,000
Q2 2023     | 300,000  | 120,000  | 85,000            | 95,000
Q3 2023     | 350,000  | 140,000  | 90,000            | 120,000
```

---

## Balance Sheet Template

### Required Sections:

**Assets**:
- Current Assets (Cash, AR, Inventory)
- Fixed Assets (PP&E, Equipment)
- Total Assets

**Liabilities**:
- Current Liabilities (AP, Short-term debt)
- Long-term Liabilities (Long-term debt)
- Total Liabilities

**Equity**:
- Shareholders' Equity
- Retained Earnings
- Total Equity

### Validation Rule:
**Assets = Liabilities + Equity** (must balance!)

### Example Structure:
```
Period         | 12/31/2023 | 12/31/2024
Current Assets | 500,000    | 650,000
Fixed Assets   | 300,000    | 280,000
Total Assets   | 800,000    | 930,000
Current Liab   | 200,000    | 250,000
LT Liabilities | 150,000    | 180,000
Equity         | 450,000    | 500,000
Total L+E      | 800,000    | 930,000
```

---

## Cash Flow Statement Template

### Required Categories:

**Operating Activities**:
- Net Income
- Depreciation/Amortization
- Changes in Working Capital
- Operating Cash Flow

**Investing Activities**:
- Capital Expenditures
- Asset Sales
- Investing Cash Flow

**Financing Activities**:
- Debt Proceeds/Repayments
- Equity Transactions
- Dividends Paid
- Financing Cash Flow

**Summary**:
- Net Change in Cash
- Beginning Cash Balance
- Ending Cash Balance

### Example Structure:
```
Period                    | 2023      | 2024
Operating Cash Flow       | 150,000   | 200,000
Investing Cash Flow       | (50,000)  | (75,000)
Financing Cash Flow       | (30,000)  | 50,000
Net Change in Cash        | 70,000    | 175,000
Beginning Cash            | 100,000   | 170,000
Ending Cash               | 170,000   | 345,000
```

---

## Data Format Requirements

### Numbers:
- **Acceptable**: 50000, 50,000, 50000.50
- **Not Acceptable**: $50,000, 50K, fifty thousand

### Dates:
- **Acceptable**: 01/01/2024, 2024-01-01, Q1 2024
- **Not Acceptable**: First quarter, Jan 1st

### Negative Numbers:
- **Acceptable**: -50000, (50000)
- **Avoid**: Red text without negative sign

### Percentages:
- **If Required**: 0.15 or 15% (depending on template)
- **Consistency**: Use same format throughout

---

## Common Validation Errors

### Error: "Confidence Score Too Low"

**Cause**: File structure significantly different from template

**Fix**:
1. Re-download official template
2. Copy only data values (not formatting)
3. Ensure headers match exactly

---

### Error: "Missing Required Fields"

**Cause**: Required columns or rows are blank or missing

**Fix**:
1. Review template documentation
2. Fill all cells marked as "required"
3. If data truly unavailable, enter "0" or "-"

---

### Error: "Formula Errors Detected"

**Cause**: Excel formulas return errors (#VALUE!, #DIV/0!, etc.)

**Fix**:
1. Check formulas for references to missing cells
2. Ensure divisors are not zero
3. Verify all referenced data exists

---

### Error: "Balance Sheet Doesn't Balance"

**Cause**: Assets ≠ Liabilities + Equity

**Fix**:
1. Double-check calculations
2. Ensure all categories sum correctly
3. Verify no missing line items

---

## Multiple Period Data

### Best Practice:
Include 2-3 years for trend analysis

### Option 1: Multiple Columns
```
Account         | 2022    | 2023    | 2024
Revenue         | 500K    | 750K    | 1M
```

### Option 2: Multiple Rows
```
Period     | Revenue
Q1 2023    | 250K
Q2 2023    | 300K
Q3 2023    | 350K
Q4 2023    | 400K
```

### Option 3: Multiple Sheets (if template supports)
- Sheet 1: 2022 Data
- Sheet 2: 2023 Data  
- Sheet 3: 2024 Data

---

## File Size Limits

**Maximum File Size**: 10 MB (typical financial templates are <1 MB)

**If Your File is Too Large**:
- Remove unnecessary worksheets
- Delete hidden rows/columns
- Remove embedded images/charts
- Simplify formatting

---

## Template Customization Guidelines

### What You CAN Customize:
- ✅ Column widths (for readability)
- ✅ Number formatting (decimals, thousands separators)
- ✅ Font size/style (visual preference)

### What You CANNOT Customize:
- ❌ Column headers (exact match required)
- ❌ Row structure (order matters)
- ❌ Formula logic (breaks validation)
- ❌ Adding/removing required fields

---

## Character Encoding

**Recommended**: UTF-8 or standard ASCII

**Issues to Avoid**:
- Special characters (curly quotes, em dashes)
- Non-English currency symbols in data cells
- Unusual date formats from non-US locales

---

## Excel Formula Tips

### Safe Formulas:
- SUM(), AVERAGE(), MIN(), MAX()
- Basic arithmetic (+, -, *, /)
- Simple cell references (A1, B2)

### Avoid:
- Macros/VBA
- External links to other workbooks
- Complex nested formulas
- Array formulas

---

## Testing Your Template

### Before Uploading:

1. **Visual Check**:
   - All required fields filled
   - No #ERROR values
   - Consistent formatting

2. **Calculation Check**:
   - Formulas produce expected results
   - Totals sum correctly
   - Balance sheet balances

3. **Format Check**:
   - Saved as .xlsx
   - No extra sheets
   - File size reasonable (<5 MB)

---

## Exporting from Accounting Software

### QuickBooks:
1. Run Profit & Loss, Balance Sheet reports
2. Export to Excel
3. Copy data into Traxxia template
4. Verify structure matches

### Xero:
1. Generate financial statements
2. Download as Excel
3. Map to Traxxia template fields
4. Test upload

### General Rule:
Don't upload accounting software exports directly - always map to Traxxia template first.

---

## Advanced: API Integration (Future)

> [!NOTE]
> Direct accounting software integration is not currently available but may be added in future versions.

---

## Troubleshooting Checklist

Before contacting support:
- [ ] Using official Traxxia template
- [ ] File is .xlsx format
- [ ] All required fields filled
- [ ] No Excel errors (#VALUE!, etc.)
- [ ] File size under 10 MB
- [ ] Column headers unchanged
- [ ] Numbers formatted correctly
- [ ] Balance sheet balances (if applicable)

---

## Next Steps

Now that you understand file requirements:

1. **[Upload your financial data](./02-uploading-financial-documents.md)** - Step-by-step process
2. **[Review Financial Analysis](./01-financial-analysis-overview.md)** - Understand available analyses
3. **[Generate insights](../04-strategic-analysis/01-strategic-analysis-overview.md)** - Combine with strategic frameworks

---

**Related Articles:**
- [Uploading Financial Documents](./02-uploading-financial-documents.md)
- [Financial Analysis Overview](./01-financial-analysis-overview.md)
- [AI Questionnaire Overview](../03-questionnaire/01-ai-assistant-overview.md)
