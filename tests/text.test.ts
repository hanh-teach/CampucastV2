import { describe, it, expect } from 'vitest';
import { normalizeText } from '../src/utils/text';

describe('normalizeText', () => {
  it('should normalize Unicode characters to NFC', () => {
    // Vietnamese "ế" can be represented as "ê" + accent (NFD) or single char (NFC)
    const nfd = "ê\u0301"; 
    const normalized = normalizeText(nfd);
    expect(normalized).toBe("\u1EBF");
    expect(normalized.length).toBe(1);
  });

  it('should strip HTML tags', () => {
    const input = "<div>Hello <b>World</b></div>";
    const expected = "Hello World";
    expect(normalizeText(input)).toBe(expected);
  });

  it('should collapse multiple spaces and tabs', () => {
    const input = "Hello \t  World";
    const expected = "Hello World";
    expect(normalizeText(input)).toBe(expected);
  });

  it('should collapse multiple newlines', () => {
    const input = "Line 1\n\n\n\nLine 2";
    const expected = "Line 1\n\nLine 2";
    expect(normalizeText(input)).toBe(expected);
  });

  it('should trim whitespace', () => {
    const input = "  Hello  ";
    const expected = "Hello";
    expect(normalizeText(input)).toBe(expected);
  });

  it('should NOT strip comparison operators like < and >', () => {
    const input = "GDP tăng <5% và lạm phát >3%";
    const expected = "GDP tăng <5% và lạm phát >3%";
    expect(normalizeText(input)).toBe(expected);
  });

  it('should handle complex math-like expressions safely', () => {
    const input = "Xác suất P(A < X < B) = 0.5";
    const expected = "Xác suất P(A < X < B) = 0.5";
    expect(normalizeText(input)).toBe(expected);
  });

  it('should preserve comparison operators without spaces', () => {
    // Edge case: a<b and c>d (previously failed due to greedy match)
    expect(normalizeText("So sánh a<b và c>d")).toBe("So sánh a<b và c>d");
    // Edge case: numerical ranges
    expect(normalizeText("Nhiệt độ 10<T<20 độ C")).toBe("Nhiệt độ 10<T<20 độ C");
    // Edge case: mixed with HTML (should strip tag but keep comparison)
    expect(normalizeText("<div>Giá trị x<y</div>")).toBe("Giá trị x<y");
    // Edge case: common abbreviations or logic stuck to brackets
    expect(normalizeText("if(a<b>c)")).toBe("if(a<b>c)");
    // Edge case: math symbols mixed with text
    expect(normalizeText("Kết quả là x<=y và z>=0")).toBe("Kết quả là x<=y và z>=0");
    // Edge case: arrows (not tags)
    expect(normalizeText("Tiến lên -> và lùi lại <-")).toBe("Tiến lên -> và lùi lại <-");
    // Extra edge cases requested by user
    expect(normalizeText("GDP<5%")).toBe("GDP<5%");
    expect(normalizeText("a<b")).toBe("a<b");
    expect(normalizeText("x>y")).toBe("x>y");
    expect(normalizeText("1<2<3")).toBe("1<2<3");
    expect(normalizeText("text<notatag>text")).toBe("text<notatag>text");
  });
});
