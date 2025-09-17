import { FileSizePipe } from '../file-size.pipe';

describe('FileSizePipe', () => {
    let pipe: FileSizePipe;

    beforeEach(() => {
        pipe = new FileSizePipe();
    });

    it('✅ debería crearse', () => {
        expect(pipe).toBeTruthy();
    });

    it('✅ Bytes = 0', () => {
        expect(pipe.transform(0)).toBe('0 Bytes');
    });

    it('✅ Bytes < 1 KB', () => {
        expect(pipe.transform(512)).toBe('512 Bytes');
    });

    it('✅ Bytes en KB', () => {
        expect(pipe.transform(2048)).toBe('2 KB');
    });

    it('✅ Bytes en MB', () => {
        expect(pipe.transform(1048576)).toBe('1 MB');
    });

    it('✅ Bytes en GB', () => {
        expect(pipe.transform(1073741824)).toBe('1 GB');
    });

    it('✅ Redondeo con decimales = 0', () => {
        expect(pipe.transform(1536, 0)).toBe('2 KB');
    });

    it('✅ Redondeo con decimales = 3', () => {
        expect(pipe.transform(1536, 3)).toBe('1.5 KB');
    });

});
